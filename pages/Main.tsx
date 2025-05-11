import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";

export default function Main() {
  const navigation = useNavigation();
  const [players, setPlayers] = useState([ ]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentType, setTournamentType] = useState("single-elimination");

  const addPlayer = () => {
    const name = newPlayerName.trim() || "Default Player";
    setPlayers((prevPlayers) => [...prevPlayers, { name, score: 0 }]);
    setNewPlayerName(""); // Clear input after adding
  };

  const removePlayer = (player) => {
    setPlayers((prevPlayers) => prevPlayers.filter((p) => p !== player));
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#121212]">
      <View className="flex-row items-center justify-center bg-[#121212]">
        <Text className="text-2xl font-bold text-white mt-4 mr-3">Set tournament details</Text>
        <Pressable
          className="bg-[#ce3636] rounded-full px-4 py-2 mt-4"
          onPress={navigation.goBack}
        >
          <Text className="text-white p-1">Back</Text>
        </Pressable>
      </View>

      {/* Add Player Section */}
      <View className="mt-4">
        <TextInput
          className="bg-[#ffffff] text-[#121212] rounded-full px-4 py-2"
          placeholder="Enter player's name"
          value={newPlayerName}
          onChangeText={setNewPlayerName}
        />
        <Pressable
          className="bg-[#1DB954] rounded-full px-4 py-2 mt-2"
          onPress={addPlayer}
        >
          <Text className="text-white">Add Player</Text>
        </Pressable>
      </View>

      <Pressable
        className="bg-[#1DB954] rounded-full px-4 py-2 mt-4"
        onPress={() =>
          navigation.navigate("Bracket", { players: players, tournamentName, tournamentType })
        }
      >
        <Text className="text-white">Create Bracket</Text>
      </Pressable>

      <Text className="text-white text-lg font-semibold mb-2 mt-4">Players:</Text>
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
