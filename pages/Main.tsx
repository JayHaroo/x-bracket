import { View, Text, Pressable } from 'react-native';

export default function Main() {
    return (
        <View className="flex-1 items-center justify-center bg-[#121212]">
            <Pressable className="bg-[#1DB954] rounded-full px-4 py-2 mt-4">
                <Text>Add a player</Text>
            </Pressable>
        </View>
    )
};