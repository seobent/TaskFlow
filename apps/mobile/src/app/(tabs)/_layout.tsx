import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { Tabs, useFocusEffect } from "expo-router";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { SafeUser, UserRole } from "@taskflow/shared";

import { getCurrentUser } from "@/lib/api";
import { useTheme } from "@/lib/theme";

type TabIconName = "home" | "profile" | "projects" | "users";

const isIOS = Platform.OS === "ios";

export default function TabsLayout() {
  const { colors } = useTheme();
  const [user, setUser] = useState<SafeUser | null>(null);

  const loadUser = useCallback(async () => {
    try {
      setUser(await getCurrentUser());
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useFocusEffect(
    useCallback(() => {
      void loadUser();
    }, [loadUser]),
  );

  const activeTint = isIOS ? "#007aff" : colors.primary;
  const inactiveTint = isIOS ? "#8e8e93" : colors.muted;
  const userIsAdmin = user?.role === UserRole.Admin;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarLabelStyle: {
          fontSize: isIOS ? 11 : 12,
          fontWeight: isIOS ? "600" : "700",
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: isIOS ? colors.border : "transparent",
          elevation: isIOS ? 0 : 12,
          minHeight: isIOS ? 62 : 72,
          paddingBottom: isIOS ? 8 : 10,
          paddingTop: isIOS ? 7 : 8,
          shadowColor: "#172033",
          shadowOffset: { height: -2, width: 0 },
          shadowOpacity: isIOS ? 0 : 0.12,
          shadowRadius: isIOS ? 0 : 8,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} name="home" />,
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} name="projects" />,
          title: "Projects",
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          href: userIsAdmin ? "/users" : null,
          tabBarIcon: ({ color }) => <TabIcon color={color} name="users" />,
          title: "Users",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} name="profile" />,
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ color, name }: { color: string; name: TabIconName }) {
  const commonProps = {
    fill: "none",
    stroke: color,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.2,
  };

  if (name === "home") {
    return (
      <Svg height={26} viewBox="0 0 32 32" width={26}>
        <Path {...commonProps} d="M5 15.5 16 6l11 9.5" />
        <Path {...commonProps} d="M8.5 14.5V27h5.2v-7.5h4.6V27h5.2V14.5" />
      </Svg>
    );
  }

  if (name === "projects") {
    return (
      <Svg height={26} viewBox="0 0 32 32" width={26}>
        <Path
          {...commonProps}
          d="M4.5 10.5h8.2l2.1 2.4h12.7v10.8a2.8 2.8 0 0 1-2.8 2.8H7.3a2.8 2.8 0 0 1-2.8-2.8Z"
        />
        <Path {...commonProps} d="M4.5 10.5V7.7h8.1l2 2.8" />
        <Rect
          {...commonProps}
          height={12}
          rx={1.7}
          width={9}
          x={18.5}
          y={15.5}
        />
        <Path {...commonProps} d="M21 19h4M21 22h4M21 25h2.8" />
      </Svg>
    );
  }

  if (name === "users") {
    return (
      <Svg height={26} viewBox="0 0 32 32" width={26}>
        <Circle {...commonProps} cx={16} cy={10} r={3.4} />
        <Path {...commonProps} d="M9.5 25.5c.8-4.2 3-6.3 6.5-6.3s5.7 2.1 6.5 6.3" />
        <Circle {...commonProps} cx={7.5} cy={13} r={2.7} />
        <Path {...commonProps} d="M3.5 24c.5-3.4 2.1-5.2 4.9-5.2" />
        <Circle {...commonProps} cx={24.5} cy={13} r={2.7} />
        <Path {...commonProps} d="M28.5 24c-.5-3.4-2.1-5.2-4.9-5.2" />
      </Svg>
    );
  }

  return (
    <Svg height={26} viewBox="0 0 32 32" width={26}>
      <Circle {...commonProps} cx={16} cy={16} r={12.2} />
      <Circle {...commonProps} cx={16} cy={12.3} r={3.8} />
      <Path {...commonProps} d="M8.6 24.2c1.3-4 3.8-6 7.4-6s6.1 2 7.4 6" />
    </Svg>
  );
}
