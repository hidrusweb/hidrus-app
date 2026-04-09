import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, View } from "react-native";
import { colors } from "../../../core/theme/theme";
import { ContaListScreen } from "./ContaListScreen";
import { GenerateBillScreen } from "./GenerateBillScreen";

const Tab = createBottomTabNavigator();

export function HomeTabsScreen() {
  return (
    <View style={styles.root}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.secondary,
          tabBarInactiveTintColor: colors.mutedText,
          tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        }}
      >
        <Tab.Screen
          name="Contas"
          component={ContaListScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Filtro"
          component={GenerateBillScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="options-outline" color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
