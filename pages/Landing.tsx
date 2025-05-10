import { View, Image, Text, Pressable } from "react-native";
import Main from "./Main";
import { useNavigation } from "@react-navigation/native";

export default function Landing() {
  const navigation = useNavigation();
  return (
    <View className="flex-1 items-center justify-center bg-[#121212]">
      <Text className="text-2xl font-bold text-white mt-4">XBracket</Text>
      <Text className="text-white">Create Local Tournament Brackers!</Text>
      <Pressable
        className="bg-[#1DB954] rounded-full px-4 py-2 mt-4"
        onPress={() => navigation.navigate("Main")}
      >
        <Text className="text-white p-3">Create a tournamenr</Text>
      </Pressable>
      <Pressable className="bg-[#1d54b9] rounded-full px-4 py-2 mt-4">
        <Text className="text-white p-3">Player Database</Text>
      </Pressable>
    </View>
  );
}
