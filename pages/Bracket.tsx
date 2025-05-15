import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Bracket() {
  const route = useRoute();
  const { players, tournamentName, tournamentType } = route.params;

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
          alert("At least 2 players are required to create a bracket.");
        } else {
          generateBracket();
        }
      }
    };

    loadState();
  }, [players]);

  const saveState = async (data = {}) => {
    try {
      await AsyncStorage.setItem(
        "lastTournament",
        JSON.stringify({
          tournamentName,
          tournamentType,
          rounds,
          currentRound,
          currentMatch,
          matchHistory,
          scores,
          ...data,
        })
      );
    } catch (err) {
      console.error("Failed to save bracket state:", err);
    }
  };

  const shuffle = (array) => {
    let copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const generateBracket = () => {
    const shuffledPlayers = shuffle(players);
    const initialRound = [];

    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      if (i + 1 < shuffledPlayers.length) {
        initialRound.push([
          { ...shuffledPlayers[i], score: 0 },
          { ...shuffledPlayers[i + 1], score: 0 },
        ]);
      } else {
        initialRound.push([
          { ...shuffledPlayers[i], score: 0 },
          { name: "Wildcard (Bye)", score: 0 },
        ]);
      }
    }

    const initialRounds = [initialRound];
    setRounds(initialRounds);
    setCurrentRound(0);
    setCurrentMatch(0);
    setScores({});

    saveState({
      rounds: initialRounds,
      currentRound: 0,
      currentMatch: 0,
      matchHistory: [],
      scores: {},
    });
  };

  const playMatch = async (winner) => {
    const updatedMatchHistory = [
      ...matchHistory,
      {
        round: currentRound + 1,
        match: currentMatch + 1,
        winner,
      },
    ];

    const updatedRounds = [...rounds];
    const nextRoundIndex = currentRound + 1;
    const currentMatches = updatedRounds[currentRound];

    if (!updatedRounds[nextRoundIndex]) {
      updatedRounds[nextRoundIndex] = [];
    }

    if (updatedRounds[nextRoundIndex].length % 2 === 0) {
      updatedRounds[nextRoundIndex].push([winner]);
    } else {
      updatedRounds[nextRoundIndex][
        updatedRounds[nextRoundIndex].length - 1
      ].push(winner);
    }

    const isLastMatch =
      currentMatch + 1 === currentMatches.length &&
      updatedRounds[nextRoundIndex].length === 1 &&
      updatedRounds[nextRoundIndex][0].length === 1;

    if (isLastMatch) {
      Alert.alert(
        "🏆 Tournament Winner!",
        `${winner.name} has won the tournament!`
      );

      // Clear saved bracket
      try {
        await AsyncStorage.removeItem("lastTournament");
        console.log("Bracket data cleared after tournament.");
      } catch (error) {
        console.error("Failed to clear bracket:", error);
      }
    }

    const newRound =
      currentMatch + 1 < currentMatches.length
        ? currentRound
        : currentRound + 1;
    const newMatch =
      currentMatch + 1 < currentMatches.length ? currentMatch + 1 : 0;

    setMatchHistory(updatedMatchHistory);
    setRounds(updatedRounds);
    setCurrentRound(newRound);
    setCurrentMatch(newMatch);
    setScores({});

    await saveState({
      rounds: updatedRounds,
      currentRound: newRound,
      currentMatch: newMatch,
      matchHistory: updatedMatchHistory,
      scores: {},
    });
  };

  const addPoints = (playerName, points) => {
    setScores((prev) => {
      const newScore = (prev[playerName] || 0) + points;

      const current = getCurrentMatch();
      const winner = current?.find((p) => p.name === playerName);

      const updated = { ...prev, [playerName]: newScore };

      saveState({ scores: updated }); // Save scores update

      if (newScore >= 5 && winner) {
        Alert.alert("Match Finished", `${playerName} reached 5 points!`, [
          {
            text: "OK",
            onPress: () => playMatch(winner),
          },
        ]);
      }

      return updated;
    });
  };

  const getCurrentMatch = () => {
    const currentMatches = rounds[currentRound];
    if (!currentMatches || currentMatches.length === 0) return null;

    if (
      currentRound === rounds.length - 1 &&
      rounds[currentRound]?.length === 1 &&
      rounds[currentRound][0]?.length === 1
    ) {
      return null;
    }

    return currentMatches[currentMatch];
  };

  return (
    <ScrollView className="flex-1 bg-[#121212] px-4 py-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white font-Oxanium text-3xl mb-4 mt-7 text-center">
          {tournamentName || "Tournament Bracket"}
        </Text>
        <Pressable
          className="bg-red-600 rounded-full px-4 py-2 mt-4"
          onPress={async () => {
            await AsyncStorage.removeItem("lastTournament");
            generateBracket(); // or navigate back
          }}
        >
          <Text className="text-white">Reset Tournament</Text>
        </Pressable>
      </View>

      {rounds.map((round, roundIndex) => (
        <View key={roundIndex} className="mb-6">
          <Text className="text-white text-xl font-semibold font-ShareTech mb-2">
            Round {roundIndex + 1}
          </Text>
          {round.map((match, matchIndex) => (
            <View
              key={matchIndex}
              className="flex-row justify-between items-center border-2 border-gray-800 rounded-lg p-3 mb-2"
            >
              <Text className="text-white">{match[0]?.name}</Text>
              <Text className="text-white">vs</Text>
              <Text className="text-white">{match[1]?.name}</Text>
            </View>
          ))}
        </View>
      ))}

      <View className="mt-6">
        {getCurrentMatch() && (
          <>
            <Text className="text-white text-xl mb-2 font-ShareTech">
              Current Match
            </Text>
            <View className="flex-row justify-between border-2 border-[#1DB954] p-3 rounded-lg mb-4">
              <Text className="text-white">{getCurrentMatch()[0].name}</Text>
              <Text className="text-white">vs</Text>
              <Text className="text-white">{getCurrentMatch()[1].name}</Text>
            </View>

            <Text className="text-white mb-2 font-ShareTech">
              Player Scores:
            </Text>
            {getCurrentMatch().map((player, idx) => (
              <View
                key={idx}
                className="mb-2 bg-gray-700 p-3 rounded-lg object-contain"
              >
                <Text className="text-white text-lg mb-1">
                  {player.name} - {scores[player.name] || 0} pts
                </Text>
                <View className="flex-row justify-between">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Pressable
                      className="bg-[#1DB954] rounded-full px-3 py-2 mr-1"
                      onPress={() => addPoints(player.name, 1)}
                    >
                      <Text className="text-white text-sm">
                        Spin Finish (+1)
                      </Text>
                    </Pressable>
                    <Pressable
                      className="bg-[#1DB954] rounded-full px-3 py-2 mx-1"
                      onPress={() => addPoints(player.name, 2)}
                    >
                      <Text className="text-white text-sm">
                        Pocket/Burst (+2)
                      </Text>
                    </Pressable>
                    <Pressable
                      className="bg-[#1DB954] rounded-full px-3 py-2 ml-1"
                      onPress={() => addPoints(player.name, 3)}
                    >
                      <Text className="text-white text-sm">
                        Extreme Finish (+3)
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>
              </View>
            ))}

            <Text className="text-white mt-4 mb-2">
              Or set winner manually:
            </Text>
            {getCurrentMatch().map((player, idx) => (
              <Pressable
                key={idx}
                className="border-2 border-[#ce3636] rounded-full px-4 py-2 my-1"
                onPress={() => playMatch(player)}
              >
                <Text className="text-white text-center">
                  Set {player.name} as Winner
                </Text>
              </Pressable>
            ))}
          </>
        )}

        {!getCurrentMatch() &&
          currentRound === rounds.length - 1 &&
          rounds[rounds.length - 1].length === 1 &&
          rounds[rounds.length - 1][0].length === 1 && (
            <Text className="text-white text-center text-2xl mt-10">
              🏆 Winner: {rounds[rounds.length - 1][0][0].name}
            </Text>
          )}
      </View>

      <View className="mt-10">
        <Text className="text-white font-ShareTech text-lg font-semibold mb-2">
          Match History
        </Text>
        {matchHistory.map((match, idx) => (
          <Text key={idx} className="text-white">
            Round {match.round} Match {match.match}: {match.winner.name} won
            with {scores[match.winner.name] || 0} pts
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}
