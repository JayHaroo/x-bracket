import { View, Text, Pressable, Alert, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import word1 from "../assets/data/word1.json";
import word2 from "../assets/data/word2.json";

export default function Main() {
  const navigation = useNavigation();
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentType, setTournamentType] = useState("single-elimination");
  const [word1Data, setWord1Data] = useState([]);
  const [word2Data, setWord2Data] = useState([]);

  useEffect(() => {
    setWord1Data(word1);
    setWord2Data(word2);
    randomWords(word1, word2); // Call after setting
  }, []);

  const randomWords = (word1Data, word2Data) => {
    const randomWord1 = word1Data[Math.floor(Math.random() * word1Data.length)];
    const randomWord2 = word2Data[Math.floor(Math.random() * word2Data.length)];
    const word = randomWord1 + " " + randomWord2;
    return setTournamentName(word);
  };

  const addPlayer = () => {
    const name = newPlayerName.trim() || "Default Player";
    setPlayers((prevPlayers) => [...prevPlayers, { name, score: 0 }]);
    setNewPlayerName(""); // Clear input after adding
  };

  const removePlayer = (player) => {
    setPlayers((prevPlayers) => prevPlayers.filter((p) => p !== player));
  };

  const handleCreateBracket = () => {
    if (players.length <= 1) {
      Alert.alert(
        "Error",
        "You must add at least two player to create a bracket."
      );
      return;
    }
    navigation.navigate("Bracket", {
      players: players,
      tournamentName: tournamentName,
      tournamentType,
    });
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#121212]">
      <View className="flex-row items-center justify-center bg-[#121212]">
        <Text className="text-2xl font-bold text-white mt-4 mr-3">
          Set tournament details
        </Text>
        <Pressable
          className="bg-[#ce3636] rounded-full px-4 py-2 mt-4"
          onPress={navigation.goBack}
        >
          <Text className="text-white p-1">Back</Text>
        </Pressable>
      </View>
      <View>
        <Text className="text-white text-lg font-semibold mb-2 mt-4">
          Tournament Name: {tournamentName}
        </Text>
      </View>
      <TextInput
        className="bg-[#ffffff] text-[#121212] w-[150px] rounded-full px-4 py-2"
        placeholder="Enter player's name"
        value={newPlayerName}
        onChangeText={setNewPlayerName}
      />

      {/* Add Player Section */}
      <View className="mt-4">
        <Pressable
          className="bg-[#1DB954] rounded-full items-center px-4 py-2 mt-2"
          onPress={addPlayer}
        >
          <Text className="text-white">Add Player</Text>
        </Pressable>
        <Pressable
          className="bg-[#1DB954] rounded-full px-4 py-2 mt-4"
          onPress={handleCreateBracket}
        >
          <Text className="text-white">Create Bracket</Text>
        </Pressable>
      </View>

      <Text className="text-white text-lg font-semibold mb-2 mt-4">
        Players:
      </Text>
      {players.map((player, index) => (
        <View
          key={index}
          className="flex-row items-center justify-between rounded-full px-4 py-2 mt-4"
        >
          <Text className="text-white mr-3">{player.name}</Text>
          <Pressable
            className="bg-[#ce3636] rounded-full p-1"
            onPress={() => removePlayer(player)}
          >
            <Text className="text-white p-1">Remove</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
