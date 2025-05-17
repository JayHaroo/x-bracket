import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

interface Player {
  name: string;
  score: number;
  history: string[];
}

interface SwissTournamentState {
  players: Player[];
  round: number;
  pairings: [Player, Player][];
  matchResults: Array<{
    round: number;
    winner: string;
    loser: string;
  }>;
}

type SwissScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Swiss'>;
type SwissScreenRouteProp = RouteProp<RootStackParamList, 'Swiss'>;

export default function SwissBracket() {
  const route = useRoute<SwissScreenRouteProp>();
  const navigation = useNavigation<SwissScreenNavigationProp>();
  const { players: initialPlayers, tournamentName } = route.params;

  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(1);
  const [pairings, setPairings] = useState<[Player, Player][]>([]);
  const [matchResults, setMatchResults] = useState<Array<{
    round: number;
    winner: string;
    loser: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [matchesCompleted, setMatchesCompleted] = useState(0);

  useEffect(() => {
    loadTournament();
  }, []);

  const loadTournament = async () => {
    try {
      const saved = await AsyncStorage.getItem("swissTournament");
      if (saved) {
        const data = JSON.parse(saved) as SwissTournamentState;
        setPlayers(data.players);
        setRound(data.round);
        setMatchResults(data.matchResults);
        setPairings(data.pairings);
      } else {
        const formatted = initialPlayers.map((p) => ({
          name: p.name,
          score: 0,
          history: [],
        }));
        setPlayers(formatted);
        generatePairings(formatted);
      }
    } catch (e) {
      console.error("Error loading Swiss tournament", e);
    } finally {
      setLoading(false);
    }
  };

  const saveTournament = async (newData: Partial<SwissTournamentState>) => {
    const currentState: SwissTournamentState = {
      players,
      round,
      pairings,
      matchResults,
      ...newData
    };
    await AsyncStorage.setItem("swissTournament", JSON.stringify(currentState));
  };

  const generatePairings = (playerList: Player[]) => {
    const sortedPlayers = [...playerList].sort((a, b) => b.score - a.score);
    const newPairings: [Player, Player][] = [];

    for (let i = 0; i < sortedPlayers.length; i += 2) {
      if (i + 1 < sortedPlayers.length) {
        newPairings.push([sortedPlayers[i], sortedPlayers[i + 1]]);
      } else {
        newPairings.push([sortedPlayers[i], { name: "Bye", score: 0, history: [] }]);
      }
    }

    setPairings(newPairings);
    saveTournament({ pairings: newPairings });
  };

  const handleMatchResult = (winnerName: string, loserName: string) => {
    const updated = players.map((p) => {
      if (p.name === winnerName) {
        return { ...p, score: p.score + 1, history: [...p.history, loserName] };
      }
      if (p.name === loserName) {
        return { ...p, history: [...p.history, winnerName] };
      }
      return p;
    });

    const updatedResults = [
      ...matchResults,
      { round, winner: winnerName, loser: loserName },
    ];

    setPlayers(updated);
    setMatchResults(updatedResults);
    setMatchesCompleted((prev) => prev + 1);

    const totalMatchesThisRound = pairings.length;

    if (matchesCompleted + 1 === totalMatchesThisRound) {
      const totalRounds = Math.ceil(Math.log2(initialPlayers.length));
      if (round >= totalRounds) {
        const champ = updated.reduce((a, b) => (a.score > b.score ? a : b));
        Alert.alert(
          "🏆 Swiss Champion!",
          `${champ.name} wins with ${champ.score} points`,
          [{ text: "OK", onPress: () => resetTournament() }]
        );
      } else {
        const nextRound = round + 1;
        setRound(nextRound);
        setMatchesCompleted(0);
        generatePairings(updated);
      }
    }
  };

  const resetTournament = async () => {
    await AsyncStorage.removeItem("swissTournament");
    setPlayers([]);
    setRound(1);
    setPairings([]);
    setMatchResults([]);
    navigation.navigate("Main");
  };

  const isMatchDecided = (player1: Player, player2: Player) => {
    return matchResults.some(
      (result) =>
        result.round === round &&
        ((result.winner === player1.name && result.loser === player2.name) ||
          (result.winner === player2.name && result.loser === player1.name))
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#121212]">
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#121212] px-4 py-6">
      <Text className="text-white text-center font-ShareTech text-3xl mb-4">
        {tournamentName || "Swiss Tournament"}
      </Text>
      <Text className="text-white font-Oxanium text-lg mb-4 text-center">
        Round {round}
      </Text>

      {pairings.map((match, index) => (
        <View
          key={index}
          className="border border-gray-700 rounded-xl p-4 mb-4 bg-gray-800"
        >
          <Text className="text-white text-lg mb-2 text-center">
            {match[0].name} vs {match[1].name}
          </Text>

          <View className="flex-row justify-around mt-2">
            <Pressable
              disabled={isMatchDecided(match[0], match[1])}
              className={`px-4 py-2 rounded-full ${
                isMatchDecided(match[0], match[1])
                  ? "bg-gray-600"
                  : "bg-[#1DB954]"
              }`}
              onPress={() => handleMatchResult(match[0].name, match[1].name)}
            >
              <Text className="text-white">Winner: {match[0].name}</Text>
            </Pressable>

            {match[1].name !== "Bye" && (
              <Pressable
                disabled={isMatchDecided(match[0], match[1])}
                className={`px-4 py-2 rounded-full ${
                  isMatchDecided(match[0], match[1])
                    ? "bg-gray-600"
                    : "bg-[#1DB954]"
                }`}
                onPress={() => handleMatchResult(match[1].name, match[0].name)}
              >
                <Text className="text-white">Winner: {match[1].name}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
      <Pressable
        className="bg-[#ce3636] px-4 py-2 rounded-full mt-8 mb-6"
        onPress={() =>
          Alert.alert("Reset Tournament", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Reset", style: "destructive", onPress: resetTournament },
          ])
        }
      >
        <Text className="text-white text-center font-semibold">
          Reset Tournament
        </Text>
      </Pressable>
      <Text className="text-white text-xl font-semibold mt-6 mb-2 font-ShareTech">
        Standings
      </Text>
      <ScrollView>
        {players
          .sort((a, b) => b.score - a.score)
          .map((player, idx) => (
            <Text key={idx} className="text-white text-lg mb-1">
              {player.name} - {player.score} pts
            </Text>
          ))}
      </ScrollView>
    </ScrollView>
  );
}
