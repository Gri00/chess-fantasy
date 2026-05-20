import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { leagueService } from "../../services/leagues";
import { C } from "../../constants/Colors";
import { s } from "../../styles/tabs/leagues.styles";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  active: C.green,
  completed: "#888",
};

function GoldInput({
  placeholder,
  value,
  onChangeText,
  autoCapitalize,
  maxLength,
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  autoCapitalize?: "none" | "characters";
  maxLength?: number;
}) {
  return (
    <View style={s.inputWrapper}>
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={C.white35}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </View>
  );
}

export default function LeaguesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [joinTeamName, setJoinTeamName] = useState("");
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await leagueService.getMyLeagues();
      setLeagues(data);
    } catch {
      Alert.alert("Error", "Failed to load leagues");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name || !teamName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setCreating(true);
    try {
      await leagueService.createLeague({
        name,
        team_name: teamName,
        roster_size: 5,
      });
      setShowCreate(false);
      setName("");
      setTeamName("");
      load();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error || "Failed to create league",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode || !joinTeamName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setJoining(true);
    try {
      await leagueService.joinByCode(inviteCode.trim(), joinTeamName.trim());
      setShowJoin(false);
      setInviteCode("");
      setJoinTeamName("");
      load();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Invalid invite code");
    } finally {
      setJoining(false);
    }
  };

  if (loading)
    return (
      <View style={[s.center, { backgroundColor: C.dark }]}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={C.gold}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>
          🏆 <Text style={{ color: C.gold }}>Leagues</Text>
        </Text>

        {leagues.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 52, marginBottom: 16 }}>♟</Text>
            <Text style={s.emptyTitle}>No leagues yet</Text>
            <Text style={s.emptySub}>
              Create a new one or join with an invite code
            </Text>
          </View>
        ) : (
          leagues.map((item) => {
            const statusColor = STATUS_COLOR[item.league.status] ?? "#888";
            return (
              <TouchableOpacity
                key={item.league.id}
                onPress={() =>
                  router.push({
                    pathname: "/league/[id]",
                    params: { id: String(item.league.id) },
                  })
                }
                activeOpacity={0.8}
              >
                <LinearGradient colors={["#1a0a3a", "#0a1220"]} style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.leagueName}>{item.league.name}</Text>
                    <View
                      style={[
                        s.statusPill,
                        {
                          backgroundColor: statusColor + "22",
                          borderColor: statusColor + "55",
                        },
                      ]}
                    >
                      <Text style={[s.statusText, { color: statusColor }]}>
                        {item.league.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.teamNameText}>Team: {item.team_name}</Text>
                  {item.league.invite_code && (
                    <View style={s.codeRow}>
                      <Text style={s.codeLabel}>INVITE CODE</Text>
                      <Text style={s.codeValue}>{item.league.invite_code}</Text>
                    </View>
                  )}
                  <Text style={s.cardArrow}>View League →</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View
        style={[
          s.actions,
          { paddingBottom: insets.bottom - 16, paddingTop: 12 },
        ]}
      >
        <TouchableOpacity
          style={s.joinBtn}
          onPress={() => setShowJoin(true)}
          activeOpacity={0.8}
        >
          <Text style={s.joinBtnText}>+ Join League</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={[C.gold, C.gold2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.createBtn}
          >
            <Text style={s.createBtnText}>+ Create League</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={showCreate} animationType="fade" transparent>
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, s.modalBackdrop]}
          activeOpacity={1}
          onPress={() => setShowCreate(false)}
        />
        <View style={s.dialog}>
          <Text style={s.dialogTitle}>New League</Text>
          <GoldInput
            placeholder="League name"
            value={name}
            onChangeText={setName}
          />
          <GoldInput
            placeholder="Your team name"
            value={teamName}
            onChangeText={setTeamName}
          />
          <TouchableOpacity
            onPress={handleCreate}
            disabled={creating}
            activeOpacity={0.85}
            style={{ marginTop: 8 }}
          >
            <LinearGradient
              colors={[C.gold, C.gold2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.sheetBtn}
            >
              {creating ? (
                <ActivityIndicator color={C.dark} />
              ) : (
                <Text style={s.sheetBtnText}>CREATE</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.cancelBtn}
            onPress={() => setShowCreate(false)}
          >
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showJoin} animationType="fade" transparent>
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, s.modalBackdrop]}
          activeOpacity={1}
          onPress={() => setShowJoin(false)}
        />
        <View style={s.dialog}>
          <Text style={s.dialogTitle}>Join League</Text>
          <GoldInput
            placeholder="Invite code (e.g. CA8265DB)"
            value={inviteCode}
            onChangeText={(t) =>
              setInviteCode(t.replace(/\s/g, "").toUpperCase())
            }
            autoCapitalize="characters"
            maxLength={8}
          />
          <GoldInput
            placeholder="Your team name"
            value={joinTeamName}
            onChangeText={setJoinTeamName}
          />
          <TouchableOpacity
            onPress={handleJoin}
            disabled={joining}
            activeOpacity={0.85}
            style={{ marginTop: 8 }}
          >
            <LinearGradient
              colors={[C.gold, C.gold2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.sheetBtn}
            >
              {joining ? (
                <ActivityIndicator color={C.dark} />
              ) : (
                <Text style={s.sheetBtnText}>JOIN</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.cancelBtn}
            onPress={() => setShowJoin(false)}
          >
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
