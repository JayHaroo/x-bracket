import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import Landing from "./pages/Landing";
import Main from "./pages/Main";
import Bracket from "./pages/Bracket";
import SwissBracket from "./pages/Swiss";

// Define the root stack parameter list
export type RootStackParamList = {
  Landing: undefined;
  Main: undefined;
  Bracket: {
    players: Array<{
      name: string;
      score: number;
    }>;
    tournamentName: string;
    tournamentType: string;
  };
  Swiss: {
    players: Array<{
      name: string;
      score: number;
    }>;
    tournamentName: string;
    tournamentType: string;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    const [fontsLoaded] = useFonts({
      ShareTech: require("./assets/fonts/ShareTech-Regular.ttf"),
      Nippo: require("./assets/fonts/Nippo-Variable.ttf"),
      Oxanium: require("./assets/fonts/Oxanium-Regular.ttf"),
    });
  
    if (!fontsLoaded) {
      return null;
    }
    
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Landing" component={Landing} />
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="Bracket" component={Bracket} />
        <Stack.Screen name="Swiss" component={SwissBracket} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
