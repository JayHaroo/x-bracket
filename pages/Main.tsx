import {
  View,
  ScrollView,
  Text,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import word1 from "../assets/data/word1.json";
import word2 from "../assets/data/word2.json";
import names from "../assets/data/names.json";
import { RootStackParamList } from "../App";

interface Player {
  name: string;
  score: number;
}

type MainScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Main"
>;

export default function Main() {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState<string>(""); 
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentType, setTournamentType] = useState("single-elimination");
  const [word1Data, setWord1Data] = useState<string[]>([]);
  const [word2Data, setWord2Data] = useState<string[]>([]);

  useEffect(() => {
    setWord1Data(word1);
    setWord2Data(word2);
    randomWords(word1, word2); // Call after setting
  }, []);

  const checkSavedTournament = async () => {
    try {
      const saved = await AsyncStorage.getItem("lastTournament");
      if (saved) {
        Alert.alert(
          "Resume Tournament",
          "A completed tournament was found. Would you like to view it?",
          [
            {
              text: "Yes",
              onPress: () => {
                const parsed = JSON.parse(saved);
                navigation.navigate("Bracket", {
                  players: parsed.rounds[0].flat(), // flattened for compatibility
                  tournamentName: parsed.tournamentName,
                  tournamentType: parsed.tournamentType,
                });
              },
            },
            {
              text: "No",
              style: "cancel",
            },
          ]
        );
      }
    } catch (err) {
      console.error("Error checking saved tournament:", err);
    }
  };

  const randomWords = (word1Data: string[], word2Data: string[]) => {
    const randomWord1 = word1Data[Math.floor(Math.random() * word1Data.length)];
    const randomWord2 = word2Data[Math.floor(Math.random() * word2Data.length)];
    const word = randomWord1 + " " + randomWord2;
    return setTournamentName(word);
  };

  const addPlayer = () => {
    const trimmedName = typeof newPlayerName === "string" ? newPlayerName.trim() : "";
    const name =
      trimmedName.length > 0
        ? trimmedName
        : names[Math.floor(Math.random() * names.length)];

    setPlayers((prevPlayers) => [...prevPlayers, { name, score: 0 }]);
    setNewPlayerName(""); // Clear input after adding
  };

  const removePlayer = (indexToRemove: number) => {
    console.log("Removing player at index:", indexToRemove);
    setPlayers((prevPlayers) => {
      const newPlayers = prevPlayers.filter(
        (_, index) => index !== indexToRemove
      );
      console.log("New players list:", newPlayers);
      return newPlayers;
    });
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

  const handleSwissMode = () => {
    if (players.length <= 1) {
      Alert.alert(
        "Error",
        "You must add at least two player to create a bracket."
      );
      return;
    }
    navigation.navigate("Swiss", {
      players: players,
      tournamentName: tournamentName,
      tournamentType,
    });
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#121212]">
      <View className="items-center">
        <View className="flex-row items-center justify-between bg-[#121212]">
          <Text className="text-2xl font-Oxanium text-white mt-4 mr-3">
            Set tournament details
          </Text>
          <Pressable
            className="bg-[#ce3636] rounded-full px-4 py-2 mt-4"
            onPress={() => navigation.navigate("Landing")}
          >
            <Text className="text-white p-1">Back</Text>
          </Pressable>
        </View>
        <View>
          <Text className="text-white text-2xl font-ShareTech font-semibold mb-2 mt-4">
            Tournament Name: {tournamentName}
          </Text>
        </View>
      </View>

      {/* Add Player Section */}
      <View className="mt-4 items-center">
        <TextInput
          className="bg-[#ffffff] text-[#121212] w-[150px] h-[50px] rounded-full px-4 py-2"
          placeholder="Enter player's name"
          placeholderClassName="text-[#121212]"
          value={newPlayerName}
          onChangeText={setNewPlayerName}
        />
        <Pressable
          className="border-2 border-[#09ff53] rounded-full items-center px-4 py-2 mt-2"
          onPress={addPlayer}
        >
          <Text className="text-white">Add Player</Text>
        </Pressable>
        <Pressable
          className="border-2 border-[#09ff53] rounded-full px-4 py-2 mt-4"
          onPress={handleCreateBracket}
        >
          <Text className="text-white">Create Bracket</Text>
        </Pressable>
        <Pressable
          className="border-2 border-[#09ff53] rounded-full px-4 py-2 mt-4"
          onPress={handleSwissMode}
        >
          <Text className="text-white">Swiss Mode</Text>
        </Pressable>
      </View>

      <Text className="text-white text-3xl font-ShareTech mb-2 mt-4">
        Players:
      </Text>
      <ScrollView className="w-10/12 max-h-[300px]">
        {players.map((player, index) => (
          <View
            key={`${player.name}-${index}`}
            className="flex-row items-center justify-between rounded-full px-4 py-2 mt-4"
          >
            <Text className="text-white mr-3">{player.name}</Text>
            <Pressable
              className="border-2 border-[#ce3636] rounded-full p-1"
              onPress={() => removePlayer(index)}
            >
              <Text className="text-white p-1">Remove</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
