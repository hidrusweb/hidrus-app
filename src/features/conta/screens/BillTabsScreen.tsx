import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RouteProp, useRoute } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../../core/theme/theme";
import { useAuthStore } from "../../auth/store/useAuthStore";
import type { AppStackParamList } from "../../../navigation/types";
import { DemonstrativoScreen } from "./DemonstrativoScreen";
import { DetalhamentoScreen } from "./DetalhamentoScreen";
import { EvolucaoScreen } from "./EvolucaoScreen";
import { HistoricoScreen } from "./HistoricoScreen";

const Tab = createBottomTabNavigator();

export function BillTabsScreen() {
  const route = useRoute<RouteProp<AppStackParamList, "BillTabs">>();
  const unidade = route.params.unidade;
  const user = useAuthStore((state) => state.user);
  const historico = (unidade.historico ?? []).slice(0, 6);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.name}>{unidade.nomeCondomino}</Text>
        <Text style={styles.subtitle}>{unidade.nomeCondominio} {unidade.unidade}</Text>
        <Text style={styles.meta}>CPF: {user?.cpf || "-"}</Text>
        <Text style={styles.meta}>E-mail: {user?.email || "-"}</Text>
      </View>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.secondary,
          tabBarLabelStyle: { fontSize: 12 },
        }}
      >
        <Tab.Screen
          name="Conta"
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" color={color} size={size} />,
          }}
        >
          {() => <DemonstrativoScreen unidade={unidade} />}
        </Tab.Screen>
        <Tab.Screen
          name="Detalhamento"
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" color={color} size={size} />,
          }}
        >
          {() => <DetalhamentoScreen unidade={unidade} />}
        </Tab.Screen>
        <Tab.Screen
          name="Historico"
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
          }}
        >
          {() => <HistoricoScreen historico={historico} />}
        </Tab.Screen>
        <Tab.Screen
          name="Evolucao"
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" color={color} size={size} />,
          }}
        >
          {() => <EvolucaoScreen historico={historico} />}
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  name: { fontSize: 20, fontWeight: "700", color: colors.text },
  subtitle: { color: colors.text, fontSize: 15, fontWeight: "500", marginTop: spacing.xs },
  meta: { color: colors.mutedText, fontSize: 14, marginTop: 2 },
  dividerWrap: { marginTop: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dividerMain: { width: 110, height: 5, borderRadius: 99, backgroundColor: "#233B70" },
  dividerDot: { width: 14, height: 5, borderRadius: 99, backgroundColor: "#233B70" },
});
