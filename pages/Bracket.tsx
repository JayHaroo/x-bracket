import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useEffect, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { useKeepAwake } from 'expo-keep-awake';

type BracketScreenRouteProp = RouteProp<RootStackParamList, "Bracket">;
type BracketScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Bracket"
>;

interface Match {
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
}

interface Player {
  name: string;
  score: number;
}

export default function Bracket() {
  useKeepAwake();
  const navigation = useNavigation<BracketScreenNavigationProp>();
  const route = useRoute<BracketScreenRouteProp>();
  const { players, tournamentName, tournamentType } = route.params;

  const [rounds, setRounds] = useState<Match[][]>([]);
  const [matchPoint, setMatchPoint] = useState<number | null>(null);
  const [playerCount, setPlayerCount] = useState(players.length);

  useEffect(() => {
    if (matchPoint !== null) {
      initializeBracket();
    }
  }, [matchPoint]);

  const initializeBracket = () => {
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const initialRound: Match[] = [];

    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      const player1: Player = { ...shuffledPlayers[i], score: 0 };
      const player2: Player | null = shuffledPlayers[i + 1]
        ? { ...shuffledPlayers[i + 1], score: 0 }
        : null;

      initialRound.push({
        player1,
        player2,
        winner: null,
      });
    }

    setRounds([initialRound]);
  };

  const handleAddScore = (
    matchIndex: number,
    playerNum: 1 | 2,
    points: number
  ) => {
    const updatedRounds = [...rounds];
    const currentRound = [...updatedRounds[updatedRounds.length - 1]];
    const match = { ...currentRound[matchIndex] };

    if (match.winner) return;

    const targetPlayer = playerNum === 1 ? match.player1 : match.player2;

    if (targetPlayer) {
      targetPlayer.score += points;

      if (targetPlayer.score >= (matchPoint ?? 5)) {
        match.winner = targetPlayer;
      }
    }

    currentRound[matchIndex] = match;
    updatedRounds[updatedRounds.length - 1] = currentRound;

    if (match.winner && currentRound.length === 1) {
      setRounds(updatedRounds);
      Alert.alert(
        "🏆 Tournament Winner",
        `${match.winner.name} wins the tournament!`,
        [{ text: "OK", onPress: () => navigation.navigate("Main") }]
      );
      return;
    }

    if (currentRound.every((m) => m.winner)) {
      const nextRound: Match[] = [];
      for (let i = 0; i < currentRound.length; i += 2) {
        const player1 = currentRound[i].winner;
        const player2 = currentRound[i + 1]?.winner || null;

        nextRound.push({
          player1: player1 ? { ...player1, score: 0 } : null,
          player2: player2 ? { ...player2, score: 0 } : null,
          winner: null,
        });
      }

      updatedRounds.push(nextRound);
    }

    setRounds(updatedRounds);
  };

  const handleSubtractScore = (
    matchIndex: number,
    playerNum: 1 | 2,
    points: number
  ) => {
    const updatedRounds = [...rounds];
    const currentRound = [...updatedRounds[updatedRounds.length - 1]];
    const match = { ...currentRound[matchIndex] };

    if (match.winner) return;

    const targetPlayer = playerNum === 1 ? match.player1 : match.player2;

    if (targetPlayer) {
      targetPlayer.score = Math.max(0, targetPlayer.score - points);
    }

    currentRound[matchIndex] = match;
    updatedRounds[updatedRounds.length - 1] = currentRound;
    setRounds(updatedRounds);
  };

  const handleAddPlayer = () => {
    const name = `Player ${playerCount + 1}`;
    const newPlayer: Player = { name, score: 0 };
    const updatedRounds = [...rounds];
    const currentRound = [...updatedRounds[0]];

    let placed = false;

    for (let i = 0; i < currentRound.length; i++) {
      const match = currentRound[i];
      if (!match.player1) {
        match.player1 = newPlayer;
        placed = true;
        break;
      } else if (!match.player2) {
        match.player2 = newPlayer;
        placed = true;
        break;
      }
    }

    if (!placed) {
      currentRound.push({
        player1: newPlayer,
        player2: null,
        winner: null,
      });
    }

    updatedRounds[0] = currentRound;
    setRounds(updatedRounds);
    setPlayerCount(playerCount + 1);
  };

  if (matchPoint === null) {
    return (
      <View className="flex-1 justify-center items-center bg-[#121212] p-4">
        <Text className="text-white text-4xl mb-4 font-ShareTech">
          Select Match Point Limit
        </Text>
        {[4, 5, 7].map((point) => (
          <Pressable
            key={point}
            onPress={() => setMatchPoint(point)}
            className="border-2 border-[#38ff1d] px-6 py-3 rounded-full my-2"
          >
            <Text className="text-white text-lg font-Oxanium">First to {point}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212] p-4">
      <Text className="text-white text-3xl font-ShareTech mb-4 mt-4 text-center">
        {tournamentName}
      </Text>

      <Pressable
        onPress={handleAddPlayer}
        className="border-2 border-[#3fff0f] rounded-full px-4 py-2 mb-4 self-center"
      >
        <Text className="text-white">+ Add Player</Text>
      </Pressable>

      <ScrollView>
        {rounds.map((round, roundIndex) => (
          <View key={roundIndex} className="mb-6">
            <Text className="text-white text-3xl font-semibold mb-2 font-ShareTech">
              Round {roundIndex + 1}
            </Text>
            {round.map((match, matchIndex) => (
              <View
                key={matchIndex}
                className="border-2 border-white rounded-lg p-4 mb-4"
              >
                <Text className="text-white text-2xl mb-2 text-[#3fff0f] font-ShareTech">
                  {match.player1?.name ?? "Bye"} vs{" "}
                  {match.player2?.name ?? "Bye"}
                </Text>

                {match.winner ? (
                  <Text className="text-green-400 font-bold">
                    Winner: {match.winner.name}
                  </Text>
                ) : (
                  <View>
                    {[match.player1, match.player2].map((player, idx) => {
                      if (!player) return null;
                      return (
                        <View key={idx} className="mb-3">
                          <Text className="text-white mb-1">
                            {player.name} - Score: {player.score}
                          </Text>
                          <View className="flex-row space-x-2 justify-evenly">
                            {[1, 2, 3].map((pt) => (
                              <Pressable
                                key={pt}
                                onPress={() =>
                                  handleAddScore(
                                    matchIndex,
                                    idx === 0 ? 1 : 2,
                                    pt
                                  )
                                }
                                className="border-2 border-[#3fff0f] w-[100px] h-[40px] justify-center items-center px-3 py-1 rounded-full mb-4"
                              >
                                <Text className="text-white text-[20px]">+{pt}</Text>
                              </Pressable>
                            ))}
                          </View>
                          <View className="flex-row space-x-2 justify-evenly mt-1">
                            {[1, 2, 3].map((pt) => (
                              <Pressable
                                key={`sub-${pt}`}
                                onPress={() =>
                                  handleSubtractScore(
                                    matchIndex,
                                    idx === 0 ? 1 : 2,
                                    pt
                                  )
                                }
                                className="border-2 border-[#fa2c2c] w-[100px] items-center px-3 py-1 rounded-full"
                              >
                                <Text className="text-white text-[20px]">-{pt}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
