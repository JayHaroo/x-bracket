import { View, Image, Text, Pressable } from "react-native";

export default function Landing() {
  return (
    <View className="flex-1 items-center justify-center bg-[#121212]">
      <Text className="text-2xl font-bold text-white mt-4">XBracket</Text>
      <Pressable className="bg-[#1DB954] rounded-full px-4 py-2 mt-4">
        <Text className="text-white p-3">Add players</Text>
        </Pressable>
    </View>
  );
}
