import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

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
  const navigation = useNavigation<BracketScreenNavigationProp>();
  const route = useRoute<BracketScreenRouteProp>();
  const { players, tournamentName, tournamentType } = route.params;

  const [rounds, setRounds] = useState<Match[][]>([]);

  useEffect(() => {
    const initializeBracket = () => {
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
      const initialRound: Match[] = [];

      for (let i = 0; i < shuffledPlayers.length; i += 2) {
        const player1 = shuffledPlayers[i];
        const player2 = shuffledPlayers[i + 1] || null;

        initialRound.push({
          player1,
          player2,
          winner: null,
        });
      }

      setRounds([initialRound]);
    };

    initializeBracket();
  }, []);

  const handleSelectWinner = (matchIndex: number, winner: Player) => {
    const updatedRounds = [...rounds];
    const currentRound = [...updatedRounds[updatedRounds.length - 1]];
    currentRound[matchIndex].winner = winner;
    updatedRounds[updatedRounds.length - 1] = currentRound;

    const isRoundComplete = currentRound.every((match) => match.winner !== null);

    if (isRoundComplete) {
      const nextRound: Match[] = [];

      for (let i = 0; i < currentRound.length; i += 2) {
        const player1 = currentRound[i].winner;
        const player2 = currentRound[i + 1]?.winner || null;
        nextRound.push({ player1, player2, winner: null });
      }

      updatedRounds.push(nextRound);
    }

    setRounds(updatedRounds);

    // If final round completed
    const lastRound = updatedRounds[updatedRounds.length - 1];
    if (lastRound.length === 1 && lastRound[0].winner) {
      Alert.alert(
        "Tournament Winner",
        `${lastRound[0].winner.name} is the winner!`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Main"),
          },
        ]
      );

      AsyncStorage.setItem(
        "lastTournament",
        JSON.stringify({
          tournamentName,
          tournamentType,
          rounds: updatedRounds,
        })
      );
    }
  };

  return (
    <View className="flex-1 bg-[#121212] p-4">
      <Text className="text-white text-3xl font-ShareTech mb-4 mt-4 text-center">
        {tournamentName}
      </Text>
      <ScrollView>
        {rounds.map((round, roundIndex) => (
          <View key={roundIndex} className="mb-6">
            <Text className="text-white text-xl font-semibold mb-2">
              Round {roundIndex + 1}
            </Text>
            {round.map((match, matchIndex) => (
              <View
                key={matchIndex}
                className="flex-row justify-between items-center border border-gray-600 rounded-lg p-3 mb-3"
              >
                <Text className="text-white">
                  {match.player1?.name ?? "Bye"} vs {match.player2?.name ?? "Bye"}
                </Text>

                {match.winner ? (
                  <Text className="text-green-400 font-bold">
                    Winner: {match.winner.name}
                  </Text>
                ) : (
                  <View className="flex-row space-x-2">
                    {match.player1 && (
                      <Pressable
                        className="bg-green-600 rounded-full px-3 py-1"
                        onPress={() => handleSelectWinner(matchIndex, match.player1!)}
                      >
                        <Text className="text-white">{match.player1.name}</Text>
                      </Pressable>
                    )}
                    {match.player2 && (
                      <Pressable
                        className="bg-blue-600 rounded-full px-3 py-1"
                        onPress={() => handleSelectWinner(matchIndex, match.player2!)}
                      >
                        <Text className="text-white">{match.player2.name}</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      <Pressable
        onPress={() => navigation.navigate("Main")}
        className="bg-[#ce3636] rounded-full px-4 py-2 mb-5 self-center"
      >
        <Text className="text-white">Back to Main</Text>
      </Pressable>
    </View>
  );
}
