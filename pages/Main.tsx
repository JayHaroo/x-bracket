import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
export default function Main() {
  const navigation = useNavigation();
  const [players, setPlayers] = useState([
    { name: "Player 1", score: 0 },
    { name: "Player 2", score: 0 },
    { name: "Player 3", score: 0 },
    { name: "Player 4", score: 0 },
  ]);
  const [bracket, setBracket] = useState([]);
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentType, setTournamentType] = useState("single-elimination");

  const addPlayer = (player) => {
    setPlayers((prevPlayers) => [...prevPlayers, player]);
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
      <Pressable className="bg-[#1DB954] rounded-full px-4 py-2 mt-4">
        <Text className="text-white">Add a player</Text>
      </Pressable>

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
