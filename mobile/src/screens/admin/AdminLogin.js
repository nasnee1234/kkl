import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import AnimatedPressable from '../../components/AnimatedPressable';
import { adminTheme } from '../../theme/colors';

export default function AdminLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigation.replace('AdminTabs');
      }
    });

    return unsub;
  }, [navigation]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('AdminTabs');
    } catch (error) {
      const messages = {
        'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
        'auth/user-not-found': 'ไม่พบบัญชีผู้ใช้นี้',
        'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
        'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        'auth/too-many-requests': 'ลองใหม่อีกครั้งในภายหลัง',
      };
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', messages[error.code] || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Logo / Icon */}
        <View style={styles.logoBox}>
          <Ionicons name="shield-checkmark" size={56} color={adminTheme.accent} />
        </View>
        <Text style={styles.title}>ระบบผู้ดูแล</Text>
        <Text style={styles.subtitle}>กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</Text>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>อีเมล</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color={adminTheme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="กรอกอีเมล"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={adminTheme.textMuted}
            />
          </View>

          <Text style={styles.label}>รหัสผ่าน</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color={adminTheme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={adminTheme.textMuted}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={adminTheme.textMuted}
              />
            </TouchableOpacity>
          </View>

          <AnimatedPressable
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>เข้าสู่ระบบ</Text>
            )}
          </AnimatedPressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: adminTheme.bg },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: adminTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: adminTheme.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: adminTheme.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 36 },
  form: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: adminTheme.text, marginBottom: 6, marginTop: 12 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminTheme.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: adminTheme.border,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: adminTheme.text },
  eyeBtn: { padding: 4 },
  loginBtn: {
    backgroundColor: adminTheme.cta,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: adminTheme.ctaText, fontSize: 16, fontWeight: '700' },
  hint: { textAlign: 'center', color: adminTheme.textMuted, fontSize: 12, marginTop: 32 },
});
