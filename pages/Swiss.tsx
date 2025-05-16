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
  const { params } = useRoute();
  const navigation = useNavigation();
  const { players: initialPlayers, tournamentName } = params;

  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(1);
  const [pairings, setPairings] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchesCompleted, setMatchesCompleted] = useState(0);

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
      console.error("Failed to load tournament", e);
    } finally {
      setLoading(false);
    }
  };

  const saveTournament = async (data) => {
    try {
      await AsyncStorage.setItem("swissTournament", JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save tournament", e);
    }
  };

  const generatePairings = (list) => {
    const sorted = [...list].sort((a, b) => b.score - a.score);
    const newPairings = [];
    const used = new Set();

    for (let i = 0; i < sorted.length; i++) {
      if (used.has(i)) continue;

      const current = sorted[i];
      let paired = false;

      for (let j = i + 1; j < sorted.length; j++) {
        const opponent = sorted[j];
        if (
          !used.has(j) &&
          current.score === opponent.score &&
          !current.history.includes(opponent.name)
        ) {
          newPairings.push([current, opponent]);
          used.add(i);
          used.add(j);
          paired = true;
          break;
        }
      }

      if (!paired) {
        newPairings.push([current, { name: "Bye", score: 0 }]);
        used.add(i);
      }
    }

    setPairings(newPairings);
    saveTournament({ players: list, round, matchResults, pairings: newPairings });
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

    const totalMatches = pairings.length;

    setPlayers(updated);
    setMatchResults(updatedResults);
    setMatchesCompleted((prev) => prev + 1);

    if (matchesCompleted + 1 === totalMatches) {
      const totalRounds = Math.ceil(Math.log2(initialPlayers.length));

      if (round >= totalRounds) {
        const champion = updated.reduce((a, b) => (a.score > b.score ? a : b));
        Alert.alert("🏆 Swiss Champion!", `${champion.name} wins with ${champion.score} points`, [
          { text: "OK", onPress: resetTournament },
        ]);
      } else {
        const next = round + 1;
        setRound(next);
        setMatchesCompleted(0);
        generatePairings(updated);
      }
    }
  };

  const isMatchDecided = (p1, p2) =>
    matchResults.some(
      (r) =>
        r.round === round &&
        ((r.winner === p1.name && r.loser === p2.name) ||
          (r.winner === p2.name && r.loser === p1.name))
    );

  const resetTournament = async () => {
    await AsyncStorage.removeItem("swissTournament");
    setPlayers([]);
    setRound(1);
    setPairings([]);
    setMatchResults([]);
    navigation.goBack();
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

      <Text className="text-white font-Oxanium text-lg text-center mb-4">
        Round {round}
      </Text>

      {pairings.map(([p1, p2], idx) => {
        const decided = isMatchDecided(p1, p2);

        return (
          <View
            key={idx}
            className="border border-gray-700 rounded-xl p-4 mb-4 bg-gray-800"
          >
            <Text className="text-white text-lg text-center mb-2">
              {p1.name} vs {p2.name}
            </Text>

            <View className="flex-row justify-around mt-2">
              <Pressable
                disabled={decided}
                onPress={() => handleMatchResult(p1.name, p2.name)}
                className={`px-4 py-2 rounded-full ${
                  decided ? "bg-gray-600" : "bg-[#1DB954]"
                }`}
              >
                <Text className="text-white">Winner: {p1.name}</Text>
              </Pressable>

              {p2.name !== "Bye" && (
                <Pressable
                  disabled={decided}
                  onPress={() => handleMatchResult(p2.name, p1.name)}
                  className={`px-4 py-2 rounded-full ${
                    decided ? "bg-gray-600" : "bg-[#1DB954]"
                  }`}
                >
                  <Text className="text-white">Winner: {p2.name}</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}

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

      <Text className="text-white text-xl font-semibold mt-6 mb-2 font-ShareTech">
        Standings
      </Text>

      {players
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => (
          <Text key={idx} className="text-white text-lg mb-1">
            {p.name} - {p.score} pts
          </Text>
        ))}
    </ScrollView>
  );
}
