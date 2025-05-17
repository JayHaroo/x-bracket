import { View, Image, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

type LandingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

export default function Landing() {
  const navigation = useNavigation<LandingScreenNavigationProp>();
  return (
    <View className="flex-1 items-center justify-center bg-[#121212]">
      <Image
        source={require("../assets/logo.png")}
        className="w-[150px] h-[150px]"
      />
      <Text className="text-5xl font-Oxanium text-white mt-4">XBracket</Text>
      <Text className="text-xl text-white font-ShareTech">Create Local BBX Tournament Brackets!</Text>
      <Pressable
        className="border-2 border-[#09ff53] rounded-full px-4 py-2 mt-4"
        onPress={() => navigation.navigate("Main")}
      >
        <Text className="text-white p-3 text-white">Create a tournament</Text>
      </Pressable>
    </View>
  );
}
