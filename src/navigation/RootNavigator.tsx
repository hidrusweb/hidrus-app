import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { useAuthStore } from "../features/auth/store/useAuthStore";
import { LoginScreen } from "../features/auth/screens/LoginScreen";
import { ProfileScreen } from "../features/auth/screens/ProfileScreen";
import { RecoverPasswordScreen } from "../features/auth/screens/RecoverPasswordScreen";
import { RecoverValidateScreen } from "../features/auth/screens/RecoverValidateScreen";
import { RegisterScreen } from "../features/auth/screens/RegisterScreen";
import { SplashScreen } from "../features/auth/screens/SplashScreen";
import { BillTabsScreen } from "../features/conta/screens/BillTabsScreen";
import { GenerateBillScreen } from "../features/conta/screens/GenerateBillScreen";
import { AppStackHeader } from "./AppStackHeader";
import type { AppStackParamList, AuthStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: "Registrar" }} />
      <AuthStack.Screen name="RecoverValidate" component={RecoverValidateScreen} options={{ title: "Recuperar senha" }} />
      <AuthStack.Screen name="RecoverPassword" component={RecoverPasswordScreen} options={{ title: "Nova senha" }} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        title: "Acesse suas contas",
        header: (props) => <AppStackHeader {...props} />,
      }}
    >
      <AppStack.Screen name="GenerateBill" component={GenerateBillScreen} />
      <AppStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          headerBackVisible: true,
        }}
      />
      <AppStack.Screen
        name="BillTabs"
        component={BillTabsScreen}
        options={{
          headerBackVisible: true,
        }}
      />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const { bootstrap, bootstrapDone, user } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!bootstrapDone) return <SplashScreen />;

  return <NavigationContainer>{user ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
