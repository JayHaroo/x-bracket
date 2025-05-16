import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Bracket() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { players, tournamentName } = params;

  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [matchHistory, setMatchHistory] = useState([]);
  const [scores, setScores] = useState({});

  useEffect(() => {
    const loadState = async () => {
      const saved = await AsyncStorage.getItem("lastTournament");
      if (saved) {
        const parsed = JSON.parse(saved);
        setRounds(parsed.rounds || []);
        setCurrentRound(parsed.currentRound || 0);
        setCurrentMatch(parsed.currentMatch || 0);
        setMatchHistory(parsed.matchHistory || []);
        setScores(parsed.scores || {});
      } else {
        if (players.length < 2) {
          Alert.alert("Error", "At least 2 players are required.");
        } else {
          generateBracket();
        }
      }
    };
    loadState();
  }, [players]);

  const saveState = async (extra = {}) => {
    await AsyncStorage.setItem(
      "lastTournament",
      JSON.stringify({
        tournamentName,
        rounds,
        currentRound,
        currentMatch,
        matchHistory,
        scores,
        ...extra,
      })
    );
  };

  const shuffle = (arr) => {
    return arr
      .map((a) => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map((a) => a[1]);
  };

  const generateBracket = async () => {
    const shuffled = shuffle(players);
    const firstRound = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      if (shuffled[i + 1]) {
        firstRound.push([
          { ...shuffled[i], score: 0 },
          { ...shuffled[i + 1], score: 0 },
        ]);
      } else {
        firstRound.push([
          { ...shuffled[i], score: 0 },
          { name: "Wildcard (Bye)", score: 0 },
        ]);
      }
    }

    const newRounds = [firstRound];
    setRounds(newRounds);
    setCurrentRound(0);
    setCurrentMatch(0);
    setMatchHistory([]);
    setScores({});
    await saveState({
      rounds: newRounds,
      currentRound: 0,
      currentMatch: 0,
      matchHistory: [],
      scores: {},
    });
  };

  const getCurrentMatch = () => {
    const round = rounds[currentRound] || [];
    return round[currentMatch] || null;
  };

  const addPoints = (playerName, points) => {
    setScores((prev) => {
      const newScore = (prev[playerName] || 0) + points;
      const updated = { ...prev, [playerName]: newScore };

      const match = getCurrentMatch();
      const winner = match?.find((p) => p.name === playerName);

      if (newScore >= 5 && winner) {
        Alert.alert("Match Finished", `${winner.name} reached 5 points!`, [
          {
            text: "OK",
            onPress: () => playMatch(winner),
          },
        ]);
      }

      saveState({ scores: updated });
      return updated;
    });
  };

  const playMatch = async (winner) => {
    const updatedRounds = [...rounds];
    const current = updatedRounds[currentRound];
    const nextRoundIndex = currentRound + 1;

    if (!updatedRounds[nextRoundIndex]) updatedRounds[nextRoundIndex] = [];

    const nextRound = updatedRounds[nextRoundIndex];
    const lastPair = nextRound[nextRound.length - 1];

    if (!lastPair || lastPair.length === 2) {
      nextRound.push([winner]);
    } else {
      lastPair.push(winner);
    }

    const updatedMatchHistory = [
      ...matchHistory,
      {
        round: currentRound + 1,
        match: currentMatch + 1,
        winner,
      },
    ];

    const isLastMatchOfFinal =
      current.length === currentMatch + 1 &&
      nextRound.length === 1 &&
      nextRound[0].length === 1;

    if (isLastMatchOfFinal) {
      const winCounts = {};

      // Count wins
      matchHistory.forEach(({ winner }) => {
        winCounts[winner.name] = (winCounts[winner.name] || 0) + 1;
      });

      // Include the last match's winner
      winCounts[winner.name] = (winCounts[winner.name] || 0) + 1;

      // Sort players by number of wins
      const ranking = Object.entries(winCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name], index) => `${index + 1}. ${name}`)
        .join("\n");

      Alert.alert(
        "🏆 Tournament Winner!",
        `${winner.name} has won!\n\nFinal Rankings:\n${ranking}`
      );

      await AsyncStorage.removeItem("lastTournament");
      navigation.goBack();
      return;
    }

    const nextMatch = currentMatch + 1 < current.length ? currentMatch + 1 : 0;
    const nextRoundVal =
      currentMatch + 1 < current.length ? currentRound : nextRoundIndex;

    setRounds(updatedRounds);
    setMatchHistory(updatedMatchHistory);
    setCurrentRound(nextRoundVal);
    setCurrentMatch(nextMatch);
    setScores({});
    await saveState({
      rounds: updatedRounds,
      matchHistory: updatedMatchHistory,
      currentRound: nextRoundVal,
      currentMatch: nextMatch,
      scores: {},
    });
  };

  const currentMatchData = getCurrentMatch();

  return (
    <ScrollView className="flex-1 bg-[#121212] px-4 py-6">
      <View className="flex-row justify-between items-center mb-4 mt-5">
        <Text className="text-white font-Oxanium text-3xl text-center">
          {tournamentName || "Tournament Bracket"}
        </Text>
        <Pressable
          className="bg-red-600 rounded-full px-4 py-2"
          onPress={async () => {
            await AsyncStorage.removeItem("lastTournament");
            generateBracket();
          }}
        >
          <Text className="text-white">Reset</Text>
        </Pressable>
      </View>

      {rounds.map((round, rIndex) => (
        <View key={rIndex} className="mb-6">
          <Text className="text-white text-xl font-semibold mb-2">
            Round {rIndex + 1}
          </Text>
          {round.map((match, mIndex) => (
            <View
              key={mIndex}
              className="flex-row justify-between border border-gray-700 p-3 rounded mb-1"
            >
              <Text className="text-white">{match[0]?.name}</Text>
              <Text className="text-white">vs</Text>
              <Text className="text-white">{match[1]?.name}</Text>
            </View>
          ))}
        </View>
      ))}

      {currentMatchData && (
        <View className="mt-6">
          <Text className="text-white text-xl mb-2">Current Match</Text>
          <View className="flex-row justify-between border border-[#1DB954] p-3 rounded mb-4">
            <Text className="text-white">{currentMatchData[0].name}</Text>
            <Text className="text-white">vs</Text>
            <Text className="text-white">{currentMatchData[1].name}</Text>
          </View>

          {currentMatchData.map((player, idx) => (
            <View key={idx} className="mb-3 bg-gray-700 p-3 rounded">
              <Text className="text-white text-lg mb-1">
                {player.name} - {scores[player.name] || 0} pts
              </Text>
              <View className="items-center">
              <ScrollView horizontal>
                {[1, 2, 3].map((point) => (
                  <Pressable
                    key={point}
                    className="bg-[#1DB954] px-3 py-2 rounded-full mx-1 w-[100px] items-center"
                    onPress={() => addPoints(player.name, point)}
                  >
                    <Text className="text-white text-sm">
                      +{point} pt{point > 1 ? "s" : ""}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              </View>
            </View>
          ))}

          <Text className="text-white mt-4 mb-2">Or set winner manually:</Text>
          {currentMatchData.map((player, idx) => (
            <Pressable
              key={idx}
              className="border border-[#ce3636] px-4 py-2 rounded-full mb-2"
              onPress={() => playMatch(player)}
            >
              <Text className="text-white text-center">
                Set {player.name} as Winner
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View className="mt-8">
        <Text className="text-white text-lg font-semibold mb-2">
          Match History
        </Text>
        {matchHistory.map((match, idx) => (
          <Text key={idx} className="text-white">
            Round {match.round} Match {match.match}: {match.winner.name}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}
