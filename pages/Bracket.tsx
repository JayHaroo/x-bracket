import { View, Text, Pressable, ScrollView, Alert, TextInput } from "react-native";
import { useEffect, useState } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { useKeepAwake } from "expo-keep-awake";

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

  const [renamingPlayer, setRenamingPlayer] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

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
            <Text className="text-white text-lg font-Oxanium">
              First to {point}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  const handleRemovePlayer = (playerName: string) => {
    const updatedRounds = [...rounds];
    const currentRound = [...updatedRounds[0]];

    const newRound = currentRound
      .map((match) => {
        if (match.player1?.name === playerName) {
          return { ...match, player1: null, winner: null };
        }
        if (match.player2?.name === playerName) {
          return { ...match, player2: null, winner: null };
        }
        return match;
      })
      .filter((match) => match.player1 || match.player2); // remove empty matches

    updatedRounds[0] = newRound;
    setRounds(updatedRounds);
    setPlayerCount((prev) => prev - 1);
  };

  const handleRenamePlayer = (playerName: string) => {
    Alert.prompt(
      "Rename Player",
      `Enter a new name for ${playerName}:`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: (newName) => {
            if (!newName) return;

            const updatedRounds = [...rounds];
            const currentRound = [...updatedRounds[0]];

            const newRound = currentRound.map((match) => {
              const updatedMatch = { ...match };

              if (updatedMatch.player1?.name === playerName) {
                updatedMatch.player1 = {
                  ...updatedMatch.player1,
                  name: newName,
                };
              }

              if (updatedMatch.player2?.name === playerName) {
                updatedMatch.player2 = {
                  ...updatedMatch.player2,
                  name: newName,
                };
              }

              return updatedMatch;
            });

            updatedRounds[0] = newRound;
            setRounds(updatedRounds);
          },
        },
      ],
      "plain-text"
    );
  };

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
                className="bg-gray-800 rounded-lg p-4 mb-4"
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
                          <View className="flex-row justify-between items-center mb-5">
                            {renamingPlayer === player.name ? (
                              <View className="flex-row items-center space-x-2">
                                <TextInput
                                  className="bg-white px-2 py-1 rounded w-32"
                                  value={newName}
                                  onChangeText={setNewName}
                                  placeholder="New name"
                                />
                                <Pressable
                                  onPress={() => {
                                    const updatedRounds = [...rounds];
                                    const firstRound = updatedRounds[0].map(
                                      (match) => {
                                        const updatedMatch = { ...match };
                                        if (
                                          updatedMatch.player1?.name ===
                                          player.name
                                        ) {
                                          updatedMatch.player1 = {
                                            ...updatedMatch.player1,
                                            name: newName,
                                          };
                                        }
                                        if (
                                          updatedMatch.player2?.name ===
                                          player.name
                                        ) {
                                          updatedMatch.player2 = {
                                            ...updatedMatch.player2,
                                            name: newName,
                                          };
                                        }
                                        return updatedMatch;
                                      }
                                    );

                                    updatedRounds[0] = firstRound;
                                    setRounds(updatedRounds);
                                    setRenamingPlayer(null);
                                    setNewName("");
                                  }}
                                  className="bg-green-500 px-2 py-1 rounded"
                                >
                                  <Text className="text-white text-xs">
                                    Save
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() => {
                                    setRenamingPlayer(null);
                                    setNewName("");
                                  }}
                                  className="bg-gray-500 px-2 py-1 rounded"
                                >
                                  <Text className="text-white text-xs">
                                    Cancel
                                  </Text>
                                </Pressable>
                              </View>
                            ) : (
                              <Text className="text-white">
                                {player.name} - Score: {player.score}
                              </Text>
                            )}

                            {roundIndex === 0 && (
                              <View className="flex-row space-x-2">
                                <Pressable
                                  onPress={() =>
                                    Alert.alert(
                                      "Remove Player",
                                      `Are you sure you want to remove ${player.name}?`,
                                      [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                          text: "Remove",
                                          style: "destructive",
                                          onPress: () =>
                                            handleRemovePlayer(player.name),
                                        },
                                      ]
                                    )
                                  }
                                  className="bg-red-600 px-3 py-2 rounded-full"
                                >
                                  <Text className="text-white text-xs">
                                    Remove
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() => {
                                    setRenamingPlayer(player.name);
                                    setNewName(player.name);
                                  }}
                                  className="bg-yellow-500 px-3 py-2 rounded-full ml-2"
                                >
                                  <Text className="text-black text-xs">
                                    Rename
                                  </Text>
                                </Pressable>
                              </View>
                            )}
                          </View>

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
                                <Text className="text-white text-[20px]">
                                  +{pt}
                                </Text>
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
                                <Text className="text-white text-[20px]">
                                  -{pt}
                                </Text>
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
