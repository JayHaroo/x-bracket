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
import { useRoute, useNavigation } from "@react-navigation/native";

export default function SwissBracket() {
  const route = useRoute();
  const navigation = useNavigation();
  const { players: initialPlayers, tournamentName } = route.params;

  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(1);
  const [pairings, setPairings] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournament();
  }, []);

  const loadTournament = async () => {
    try {
      const saved = await AsyncStorage.getItem("swissTournament");
      if (saved) {
        const data = JSON.parse(saved);
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

  const saveTournament = async (newData) => {
    await AsyncStorage.setItem("swissTournament", JSON.stringify(newData));
  };

  const generatePairings = (playerList) => {
    const sorted = [...playerList].sort((a, b) => b.score - a.score);
    const newPairs = [];
    const used = new Set();

    for (let i = 0; i < sorted.length; i++) {
      if (used.has(i)) continue;

      for (let j = i + 1; j < sorted.length; j++) {
        if (!used.has(j) && !sorted[i].history.includes(sorted[j].name)) {
          newPairs.push([sorted[i], sorted[j]]);
          used.add(i);
          used.add(j);
          break;
        }
      }

      if (!used.has(i)) {
        newPairs.push([sorted[i], { name: "Bye", score: 0 }]);
        used.add(i);
      }
    }

    setPairings(newPairs);
    saveTournament({
      players: playerList,
      round,
      pairings: newPairs,
      matchResults,
    });
  };

  const handleMatchResult = (winnerName, loserName) => {
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

    const totalRounds = Math.ceil(Math.log2(players.length)) + 1;

    if (round >= totalRounds) {
      const champ = updated.reduce((a, b) => (a.score > b.score ? a : b));
      Alert.alert("🏆 Swiss Champion!", `${champ.name} wins with ${champ.score} points`, [
        {
          text: "OK",
          onPress: () => resetTournament(),
        },
      ]);
      return;
    }

    setRound((prev) => prev + 1);
    setPlayers(updated);
    setMatchResults(updatedResults);
    generatePairings(updated);
  };

  const resetTournament = async () => {
    await AsyncStorage.removeItem("swissTournament");
    setPlayers([]);
    setRound(1);
    setPairings([]);
    setMatchResults([]);
    navigation.goBack(); // Or you could reload the screen
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
              className="bg-[#1DB954] px-4 py-2 rounded-full"
              onPress={() => handleMatchResult(match[0].name, match[1].name)}
            >
              <Text className="text-white">Winner: {match[0].name}</Text>
            </Pressable>

            {match[1].name !== "Bye" && (
              <Pressable
                className="bg-[#1DB954] px-4 py-2 rounded-full"
                onPress={() => handleMatchResult(match[1].name, match[0].name)}
              >
                <Text className="text-white">Winner: {match[1].name}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}

      <Text className="text-white text-xl font-semibold mt-6 mb-2 font-ShareTech">
        Standings
      </Text>
      {players
        .sort((a, b) => b.score - a.score)
        .map((player, idx) => (
          <Text key={idx} className="text-white text-lg mb-1">
            {player.name} - {player.score} pts
          </Text>
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
        <Text className="text-white text-center font-semibold">Reset Tournament</Text>
      </Pressable>
    </ScrollView>
  );
}
