import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Main() {
  const navigation = useNavigation();
  return (
    <View className="flex-1 items-center justify-center bg-[#121212]">
      <Pressable
        className="bg-[#ce3636] rounded-full px-4 py-2 mt-4"
        onPress={navigation.goBack}
      >
        <Text className="text-white p-1">Back</Text>
      </Pressable>
      <Pressable className="bg-[#1DB954] rounded-full px-4 py-2 mt-4">
        <Text>Add a player</Text>
      </Pressable>
    </View>
  );
}
