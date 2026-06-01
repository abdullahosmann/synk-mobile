/**
 * EditProfile — RN port of src/screens/main/EditProfile.tsx.
 *
 * Profile form: name, handle (@, lowercased/sanitized), bio (150-char counter),
 * age, height (cm or ft+in depending on user.heightUnit), current weight, and
 * a gender toggle. Save is disabled until name + handle + gender are set;
 * saving writes to the user and navigates back.
 *
 * Web→RN: navigate(-1) → router.back(); header Save button retained;
 * <input>/<textarea> → <TextInput> (numeric keyboards for age/height/weight);
 * handle sanitization preserved.
 */
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

const cmToFtIn = (cm: number): { ft: number; in: number } => {
  const totalInches = Math.round(cm / 2.54);
  return { ft: Math.floor(totalInches / 12), in: totalInches % 12 };
};
const ftInToCm = (ft: number, inches: number): number => Math.round((ft * 12 + inches) * 2.54);

function ff(isArabic: boolean, weight: 400 | 500 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function EditProfile() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const heightUnit = user?.heightUnit || "cm";

  const [name, setName] = useState(user?.name || "");
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [age, setAge] = useState<number>(user?.age || 25);
  const [height, setHeight] = useState<number>(user?.height || 170);
  const [ftVal, setFtVal] = useState(cmToFtIn(height).ft);
  const [inVal, setInVal] = useState(cmToFtIn(height).in);
  const [currentWeight, setCurrentWeight] = useState<number>(user?.currentWeight || 70);
  const [gender, setGender] = useState<"male" | "female" | null>(user?.gender || null);

  useEffect(() => {
    const { ft, in: inches } = cmToFtIn(height);
    if (ft !== ftVal || inches !== inVal) {
      setFtVal(ft);
      setInVal(inches);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  const isSaveDisabled = name.trim() === "" || handle.trim() === "" || gender === null;

  const handleHandleChange = (val: string) => setHandle(val.toLowerCase().replace(/[^a-z0-9_]/g, ""));

  const handleSave = () => {
    if (isSaveDisabled) return;
    setUser((prev) => ({ ...prev, name, handle, bio, age, height, currentWeight, gender }) as any);
    showToast(isArabic ? "تم الحفظ" : "Profile updated", "success");
    router.back();
  };

  const label = (text: string) => (
    <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{text}</AppText>
  );

  const fieldStyle = {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.ink,
    textAlign: (isArabic ? "right" : "left") as "right" | "left",
  };

  const unitLabel = (text: string) => <AppText style={{ fontSize: 14, color: colors.ink, fontFamily: ff(isArabic) }}>{text}</AppText>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvasParchment, zIndex: 50 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "تعديل الملف" : "Edit profile"}</AppText>
        <Pressable onPress={handleSave} disabled={isSaveDisabled} style={{ paddingHorizontal: 8, opacity: isSaveDisabled ? 0.4 : 1 }}>
          <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "حفظ" : "Save"}</AppText>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 48, gap: 16, maxWidth: 448, width: "100%", alignSelf: "center" }}>
        {/* Name */}
        <View>
          {label(isArabic ? "الاسم" : "Name")}
          <TextInput value={name} onChangeText={setName} placeholderTextColor={colors.inkMuted48} style={fieldStyle} />
        </View>

        {/* Handle */}
        <View>
          {label(isArabic ? "اسم المستخدم" : "Handle")}
          <View style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, height: 48, paddingHorizontal: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }}>
            <AppText style={{ fontSize: 14, color: colors.inkMuted48, marginHorizontal: 4 }}>@</AppText>
            <TextInput value={handle} onChangeText={handleHandleChange} autoCapitalize="none" style={{ flex: 1, fontSize: 14, color: colors.ink, textAlign: "left" }} />
          </View>
        </View>

        {/* Bio */}
        <View>
          {label(isArabic ? "النبذة" : "Bio")}
          <View style={{ position: "relative" }}>
            <TextInput
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, 150))}
              multiline
              style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, minHeight: 80, padding: 16, fontSize: 14, color: colors.ink, textAlignVertical: "top", textAlign: isArabic ? "right" : "left" }}
            />
            <AppText style={{ position: "absolute", bottom: 12, right: 16, fontSize: 11, color: colors.inkMuted48 }}>{bio.length}/150</AppText>
          </View>
        </View>

        {/* Age */}
        <View>
          {label(isArabic ? "العمر" : "Age")}
          <TextInput value={age ? String(age) : ""} onChangeText={(t) => setAge(parseInt(t) || 0)} keyboardType="number-pad" style={fieldStyle} />
        </View>

        {/* Height */}
        <View>
          {label(isArabic ? "الطول" : "Height")}
          {heightUnit === "cm" ? (
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
              <TextInput value={height ? String(height) : ""} onChangeText={(t) => setHeight(parseInt(t) || 0)} keyboardType="number-pad" style={[fieldStyle, { flex: 1 }]} />
              {unitLabel("cm")}
            </View>
          ) : (
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <TextInput value={ftVal === 0 && inVal === 0 ? "" : String(ftVal)} onChangeText={(t) => { const v = parseInt(t) || 0; setFtVal(v); setHeight(ftInToCm(v, inVal)); }} keyboardType="number-pad" style={[fieldStyle, { flex: 1 }]} />
              {unitLabel(isArabic ? "قدم" : "ft")}
              <TextInput value={ftVal === 0 && inVal === 0 ? "" : String(inVal)} onChangeText={(t) => { const v = parseInt(t) || 0; setInVal(v); setHeight(ftInToCm(ftVal, v)); }} keyboardType="number-pad" style={[fieldStyle, { flex: 1 }]} />
              {unitLabel(isArabic ? "بوصة" : "in")}
            </View>
          )}
        </View>

        {/* Current weight */}
        <View>
          {label(isArabic ? "الوزن الحالي" : "Current weight")}
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
            <TextInput value={currentWeight ? String(currentWeight) : ""} onChangeText={(t) => setCurrentWeight(parseInt(t) || 0)} keyboardType="number-pad" style={[fieldStyle, { flex: 1 }]} />
            {unitLabel(user?.weightUnit || "kg")}
          </View>
        </View>

        {/* Gender */}
        <View style={{ paddingTop: 8 }}>
          {label(isArabic ? "الجنس" : "Gender")}
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
            {(["male", "female"] as const).map((g) => {
              const active = gender === g;
              return (
                <Pressable key={g} onPress={() => setGender(g)} style={{ flex: 1, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 9999, borderWidth: 1, backgroundColor: active ? colors.primary : colors.canvasParchment, borderColor: active ? colors.primary : colors.hairline }}>
                  <AppText style={{ fontSize: 14, fontWeight: "500", color: active ? "#fff" : colors.ink, fontFamily: ff(isArabic, 500) }}>{g === "male" ? (isArabic ? "ذكر" : "Male") : isArabic ? "أنثى" : "Female"}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
