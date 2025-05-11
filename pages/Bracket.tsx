import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";

export default function Bracket() {
  const route = useRoute();
  const { players, tournamentName, tournamentType } = route.params;

  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [matchHistory, setMatchHistory] = useState([]);
  const [scores, setScores] = useState({});

  useEffect(() => {
    if (players.length < 2) {
      alert("At least 2 players are required to create a bracket.");
    } else {
      generateBracket();
    }
  }, [players]);

  const shuffle = (array: any) => {
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
          { name: shuffledPlayers[i], score: 0 },
          { name: shuffledPlayers[i + 1], score: 0 },
        ]);
      } else {
        initialRound.push([
          { name: shuffledPlayers[i], score: 0 },
          { name: "Wildcard (Bye)", score: 0 },
        ]);
      }
    }

    setRounds([initialRound]);
    setCurrentRound(0);
    setCurrentMatch(0);
    setScores({});
  };

  const playMatch = (winner: any) => {
    setMatchHistory((prev) => [
      ...prev,
      {
        round: currentRound + 1,
        match: currentMatch + 1,
        winner,
      },
    ]);

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

    if (currentMatch + 1 < currentMatches.length) {
      setCurrentMatch((prev) => prev + 1);
    } else {
      setCurrentRound((prev) => prev + 1);
      setCurrentMatch(0);
    }

    setScores({});
    setRounds(updatedRounds);
  };

  const addPoints = (playerName: string, points: number) => {
    setScores((prev) => {
      const newScore = (prev[playerName] || 0) + points;

      if (newScore >= 5) {
        const current = getCurrentMatch();
        const winner = current?.find((p) => p.name === playerName);
        if (winner) {
          Alert.alert("Match Finished", `${playerName} reached 5 points!`, [
            {
              text: "OK",
              onPress: () => playMatch(winner),
            },
          ]);
        }
      }

      return { ...prev, [playerName]: newScore };
    });
  };

  const getCurrentMatch = () => {
    const currentMatches = rounds[currentRound];
    if (!currentMatches || currentMatches.length === 0) return null;
    return currentMatches[currentMatch];
  };

  return (
    <ScrollView className="flex-1 bg-[#121212] px-4 py-6">
      <Text className="text-white text-3xl font-bold mb-4 text-center">
        {tournamentName || "Tournament Bracket"}
      </Text>

      {rounds.map((round, roundIndex) => (
        <View key={roundIndex} className="mb-6">
          <Text className="text-white text-xl font-semibold mb-2">
            Round {roundIndex + 1}
          </Text>
          {round.map((match, matchIndex) => (
            <View
              key={matchIndex}
              className="flex-row justify-between items-center bg-gray-800 rounded-lg p-3 mb-2"
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
            <Text className="text-white text-xl mb-2">Current Match</Text>
            <View className="flex-row justify-between bg-[#1DB954] p-3 rounded-lg mb-4">
              <Text className="text-white">{getCurrentMatch()[0].name}</Text>
              <Text className="text-white">vs</Text>
              <Text className="text-white">{getCurrentMatch()[1].name}</Text>
            </View>

            <Text className="text-white mb-2">Player Scores:</Text>
            {getCurrentMatch().map((player, idx) => (
              <View key={idx} className="mb-2 bg-gray-700 p-3 rounded-lg">
                <Text className="text-white text-lg mb-1">
                  {player.name} - {scores[player.name] || 0} pts
                </Text>
                <View className="flex-row justify-between">
                  <Pressable
                    className="bg-[#1DB954] rounded-full px-3 py-2 mr-1"
                    onPress={() => addPoints(player.name, 1)}
                  >
                    <Text className="text-white text-sm">Spin Finish (+1)</Text>
                  </Pressable>
                  <Pressable
                    className="bg-[#1DB954] rounded-full px-3 py-2 mx-1"
                    onPress={() => addPoints(player.name, 2)}
                  >
                    <Text className="text-white text-sm">Pocket/Burst (+2)</Text>
                  </Pressable>
                  <Pressable
                    className="bg-[#1DB954] rounded-full px-3 py-2 ml-1"
                    onPress={() => addPoints(player.name, 3)}
                  >
                    <Text className="text-white text-sm">Extreme Finish (+3)</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Text className="text-white mt-4 mb-2">Or set winner manually:</Text>
            {getCurrentMatch().map((player, idx) => (
              <Pressable
                key={idx}
                className="bg-[#ce3636] rounded-full px-4 py-2 my-1"
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
        <Text className="text-white text-lg font-semibold mb-2">
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
