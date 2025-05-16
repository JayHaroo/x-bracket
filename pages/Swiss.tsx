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
        const formattedPlayers = initialPlayers.map((p) => ({
          name: p.name,
          score: 0,
          history: [],
        }));
        setPlayers(formattedPlayers);
        generatePairings(formattedPlayers);
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

  const generatePairings = (playerList) => {
    const sortedPlayers = [...playerList].sort((a, b) => b.score - a.score);
    const newPairings = [];
    const usedIndexes = new Set();

    for (let i = 0; i < sortedPlayers.length; i++) {
      if (usedIndexes.has(i)) continue;

      const current = sortedPlayers[i];

      let paired = false;
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        const opponent = sortedPlayers[j];
        if (
          !usedIndexes.has(j) &&
          current.score === opponent.score &&
          !current.history.includes(opponent.name)
        ) {
          newPairings.push([current, opponent]);
          usedIndexes.add(i);
          usedIndexes.add(j);
          paired = true;
          break;
        }
      }

      if (!paired) {
        newPairings.push([current, { name: "Bye", score: 0 }]);
        usedIndexes.add(i);
      }
    }

    setPairings(newPairings);
    saveTournament({ players: playerList, round, matchResults, pairings: newPairings });
  };

  const handleMatchResult = (winnerName, loserName) => {
    const updatedPlayers = players.map((p) => {
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

    const totalMatchesThisRound = pairings.length;

    setPlayers(updatedPlayers);
    setMatchResults(updatedResults);
    setMatchesCompleted((prev) => prev + 1);

    if (matchesCompleted + 1 === totalMatchesThisRound) {
      const totalRounds = Math.ceil(Math.log2(initialPlayers.length));

      if (round >= totalRounds) {
        const champion = updatedPlayers.reduce((a, b) =>
          a.score > b.score ? a : b
        );
        Alert.alert(
          "🏆 Swiss Champion!",
          `${champion.name} wins with ${champion.score} points`,
          [{ text: "OK", onPress: resetTournament }]
        );
      } else {
        const nextRound = round + 1;
        setRound(nextRound);
        setMatchesCompleted(0);
        generatePairings(updatedPlayers);
      }
    }
  };

  const isMatchDecided = (player1, player2) =>
    matchResults.some(
      (res) =>
        res.round === round &&
        ((res.winner === player1.name && res.loser === player2.name) ||
          (res.winner === player2.name && res.loser === player1.name))
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

      <Text className="text-white font-Oxanium text-lg mb-4 text-center">
        Round {round}
      </Text>

      {pairings.map((match, idx) => {
        const [p1, p2] = match;
        const decided = isMatchDecided(p1, p2);

        return (
          <View
            key={idx}
            className="border border-gray-700 rounded-xl p-4 mb-4 bg-gray-800"
          >
            <Text className="text-white text-lg mb-2 text-center">
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
        <Text className="text-white text-center font-semibold">
          Reset Tournament
        </Text>
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
