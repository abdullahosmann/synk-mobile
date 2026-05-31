/**
 * ProgressPhotos — RN port of src/screens/main/ProgressPhotos.tsx.
 *
 * Timeline of dated photo sets (3 angle slots: front/side/back) and a Compare
 * mode (before/after pickers + per-angle side-by-side + weight delta). Add flow
 * uses the camera or gallery (expo-image-picker), then a preview sheet (date +
 * angle) saves via the RN photoStorage. Long-press a set to delete. Compare's
 * Share captures the on-screen comparison with react-native-view-shot + sharing.
 *
 * Web→RN: IndexedDB photoStorage → expo-file-system; <input capture> →
 * expo-image-picker; window.confirm → Alert.alert; <select> → tap-to-cycle
 * pickers; html-to-image share → captureRef + expo-sharing. (The dedicated
 * 1080×1920 share template stays in the separate ShareCardRenderer task.)
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { ChevronLeft, Camera, Plus, ArrowLeftRight, Share2, Upload, Heart } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import BottomSheet from "../src/components/BottomSheet";
import { TemplateProgressComparison } from "../src/components/share-templates/WorkoutShareTemplates";
import { useToast } from "../src/components/ToastProvider";
import { savePhotoUri, getPhotoUrl, deletePhotoBlob } from "../src/lib/photoStorage";
import { useTheme } from "../src/theme/ThemeProvider";
import { AppText } from "../src/components/ui/Typography";
import type { ProgressPhotoEntry } from "../src/types";

const GREEN = "#34c759";
const RED = "#ff3b30";
const ANGLES = ["front", "side", "back"] as const;
type Angle = (typeof ANGLES)[number];

function ff(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

export default function ProgressPhotos() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const isDark = theme === "dark";

  const progressPhotos = user.progressPhotos || [];

  const [viewMode, setViewMode] = useState<"timeline" | "compare">("timeline");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  const [imgUri, setImgUri] = useState("");
  const [uploadDate, setUploadDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [uploadAngle, setUploadAngle] = useState<Angle>("front");
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [showShareSheet, setShowShareSheet] = useState(false);
  const shareRef = useRef<View>(null);

  const groupedPhotos = useMemo(() => {
    const groups: Record<string, ProgressPhotoEntry[]> = {};
    progressPhotos.forEach((p) => {
      (groups[p.date] ||= []).push(p);
    });
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({ date, photos: groups[date], weight: groups[date].find((x) => x.weight)?.weight }));
  }, [progressPhotos]);

  useEffect(() => {
    (async () => {
      const ms: Record<string, string> = {};
      for (const p of progressPhotos) if (!urls[p.photoId]) ms[p.photoId] = await getPhotoUrl(p.photoId);
      if (Object.keys(ms).length > 0) setUrls((prev) => ({ ...prev, ...ms }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPhotos]);

  useEffect(() => {
    if (groupedPhotos.length >= 2 && viewMode === "compare") {
      if (!compareA) setCompareA(groupedPhotos[groupedPhotos.length - 1].date);
      if (!compareB) setCompareB(groupedPhotos[0].date);
    } else if (groupedPhotos.length === 1 && viewMode === "compare") {
      setCompareA(groupedPhotos[0].date);
      setCompareB(groupedPhotos[0].date);
    }
  }, [groupedPhotos, viewMode, compareA, compareB]);

  const pick = async (mode: "camera" | "library") => {
    setShowAddSheet(false);
    try {
      const perm = mode === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showToast(isArabic ? "الإذن مرفوض" : "Permission denied", "info");
        return;
      }
      const result = mode === "camera" ? await ImagePicker.launchCameraAsync({ quality: 0.8 }) : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        setImgUri(result.assets[0].uri);
        setShowPreviewSheet(true);
      }
    } catch {
      showToast(isArabic ? "حدث خطأ" : "Something went wrong", "error");
    }
  };

  const handleSavePhoto = async () => {
    if (!imgUri) return;
    const photoId = `photo_${Date.now()}`;
    const stored = await savePhotoUri(photoId, imgUri);
    const isToday = uploadDate === new Date().toISOString().split("T")[0];
    const weight = isToday ? user.currentWeight : undefined;
    const newEntry: ProgressPhotoEntry = { id: photoId, date: uploadDate, angle: uploadAngle, photoId, weight };
    const updated = progressPhotos.filter((p) => !(p.date === uploadDate && p.angle === uploadAngle));
    updated.push(newEntry);
    setUser({ ...user, progressPhotos: updated });
    setUrls((prev) => ({ ...prev, [photoId]: stored }));
    setShowPreviewSheet(false);
    setImgUri("");
  };

  const handleDeleteSet = (date: string) => {
    Alert.alert(isArabic ? "مسح الصور" : "Delete photos", isArabic ? "متأكد انك عايز تمسح صور اليوم ده؟" : "Delete all photos for this date?", [
      { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
      {
        text: isArabic ? "مسح" : "Delete",
        style: "destructive",
        onPress: async () => {
          for (const p of progressPhotos.filter((p) => p.date === date)) await deletePhotoBlob(p.photoId);
          setUser({ ...user, progressPhotos: progressPhotos.filter((p) => p.date !== date) });
        },
      },
    ]);
  };

  const handleShareClick = () => {
    if (user.profileVisibility === "private" || user.preferences?.autoShareDisabled) {
      showToast(isArabic ? "قم بتفعيل مشاركة الصور في الإعدادات أولاً." : "Enable photo sharing in Settings first.", "error");
      return;
    }
    setShowShareSheet(true);
  };

  const handleShareCapture = async () => {
    if (!shareRef.current) return;
    try {
      const uri = await captureRef(shareRef, { format: "png", quality: 1, width: 1080, height: 1920 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      showToast(isArabic ? "تم حفظ الصورة" : "Image saved", "success");
    } catch {
      /* ignore */
    }
  };

  const getAgeStr = (dateStr: string) => {
    const days = Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return isArabic ? "النهارده" : "Today";
    const weeks = Math.round(days / 7);
    if (weeks > 0) return isArabic ? `من ${weeks} أسبوع` : `${weeks} weeks ago`;
    return isArabic ? `من ${days} يوم` : `${days} days ago`;
  };

  const setA = groupedPhotos.find((g) => g.date === compareA);
  const setB = groupedPhotos.find((g) => g.date === compareB);

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const slot = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const toggleBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const wUnit = user.weightUnit || "kg";
  const convW = (kg: number) => (wUnit === "lb" ? kg * 2.20462 : kg);

  const cyclePicker = (current: string, set: (d: string) => void) => {
    if (groupedPhotos.length < 2) return;
    const idx = groupedPhotos.findIndex((g) => g.date === current);
    set(groupedPhotos[(idx + 1) % groupedPhotos.length].date);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingTop: insets.top + 8 }}>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", height: 48, paddingHorizontal: 16 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
          </Pressable>
          <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "صور التقدّم" : "Progress Photos"}</AppText>
          {viewMode === "timeline" ? (
            <Pressable onPress={() => setShowAddSheet(true)} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.primary + "1A", alignItems: "center", justifyContent: "center" }}>
              <Plus size={20} color={colors.primary} />
            </Pressable>
          ) : (
            <Pressable onPress={handleShareClick} style={{ width: 44, height: 44, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}>
              <Share2 size={20} color={colors.primary} />
            </Pressable>
          )}
        </View>
        <View style={{ alignItems: "center", paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", backgroundColor: toggleBg, padding: 4, borderRadius: 10 }}>
            {(["timeline", "compare"] as const).map((m) => {
              const sel = viewMode === m;
              return (
                <Pressable key={m} onPress={() => setViewMode(m)} style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: sel ? cardBg : "transparent" }}>
                  <AppText style={{ fontSize: 13, fontWeight: "600", color: sel ? colors.ink : colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{m === "timeline" ? (isArabic ? "التسلسل الزمني" : "Timeline") : isArabic ? "مقارنة" : "Compare"}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {viewMode === "timeline" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 100, maxWidth: 512, width: "100%", alignSelf: "center" }}>
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.primary + "14", borderLeftWidth: isArabic ? 0 : 4, borderRightWidth: isArabic ? 4 : 0, borderColor: colors.primary, borderTopRightRadius: isArabic ? 0 : 8, borderBottomRightRadius: isArabic ? 0 : 8, borderTopLeftRadius: isArabic ? 8 : 0, borderBottomLeftRadius: isArabic ? 8 : 0, padding: 12 }}>
            <AppText style={{ fontSize: 13, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? "ننصح بصورة كل ١-٢ أسبوع. نفس الوقت، نفس الإضاءة، نفس الوضعيات." : "We recommend a photo every 1-2 weeks. Same time of day, same lighting, same poses."}</AppText>
          </View>

          {groupedPhotos.length === 0 ? (
            <View style={{ paddingVertical: 80, alignItems: "center" }}>
              <Camera size={48} color={colors.inkMuted48} style={{ opacity: 0.5, marginBottom: 16 }} />
              <AppText style={{ fontSize: 15, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? "مفيش صور لسه" : "No photos yet"}</AppText>
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {groupedPhotos.map((group) => {
                const d = new Date(group.date);
                const dateStr = isArabic ? d.toLocaleDateString("ar-EG", { month: "long", day: "numeric" }) : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <Pressable key={group.date} onLongPress={() => handleDeleteSet(group.date)} style={{ backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, padding: 16, marginHorizontal: 16, marginBottom: 4 }}>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <AppText style={{ fontSize: 15, fontWeight: "700", color: colors.ink, fontFamily: ff(isArabic, 700) }}>{dateStr}{group.weight ? ` · ${convW(group.weight).toFixed(1)}${wUnit}` : ""}</AppText>
                      <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{getAgeStr(group.date)}</AppText>
                    </View>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
                      {ANGLES.map((ang) => {
                        const p = group.photos.find((x) => x.angle === ang);
                        return p ? (
                          <View key={ang} style={{ flex: 1, aspectRatio: 3 / 4, backgroundColor: slot, borderRadius: 8, overflow: "hidden" }}>
                            {urls[p.photoId] ? <Image source={{ uri: urls[p.photoId] }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : null}
                          </View>
                        ) : (
                          <Pressable key={ang} onPress={() => { setUploadDate(group.date); setUploadAngle(ang); setShowAddSheet(true); }} style={{ flex: 1, aspectRatio: 3 / 4, borderRadius: 8, borderWidth: 2, borderStyle: "dashed", borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                            <Plus size={16} color={colors.inkMuted48} style={{ marginBottom: 4 }} />
                            <AppText style={{ fontSize: 10, color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1 }}>{ang}</AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {viewMode === "compare" && setA && setB && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 100, maxWidth: 512, width: "100%", alignSelf: "center" }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", paddingHorizontal: 16, gap: 16, marginBottom: 16, alignItems: "flex-end" }}>
            {[{ label: isArabic ? "قبل" : "BEFORE", val: compareA, set: setCompareA }, { label: isArabic ? "بعد" : "AFTER", val: compareB, set: setCompareB }].map((sel, i) => (
              <React.Fragment key={i}>
                {i === 1 && <View style={{ paddingBottom: 8 }}><ArrowLeftRight size={16} color={colors.inkMuted48} /></View>}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <AppText style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: colors.inkMuted48, marginBottom: 4, fontWeight: "700", fontFamily: ff(isArabic, 700) }}>{sel.label}</AppText>
                  <Pressable onPress={() => cyclePicker(sel.val, sel.set)} style={{ width: "100%", backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 8 }}>
                    <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, textAlign: "center", fontFamily: ff(isArabic, 600) }}>{sel.val}</AppText>
                  </Pressable>
                </View>
              </React.Fragment>
            ))}
          </View>

          <View style={{ paddingHorizontal: 16, gap: 16, backgroundColor: colors.canvasParchment }}>
            {ANGLES.map((ang) => {
              const pA = setA.photos.find((p) => p.angle === ang);
              const pB = setB.photos.find((p) => p.angle === ang);
              if (!pA && !pB) return null;
              return (
                <View key={ang}>
                  <AppText style={{ fontSize: 12, fontWeight: "700", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4, textAlign: "center", fontFamily: ff(isArabic, 700) }}>{ang}</AppText>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
                    {[pA, pB].map((p, i) => (
                      <View key={i} style={{ flex: 1, aspectRatio: 3 / 4, backgroundColor: slot, borderRadius: 12, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                        {p && urls[p.photoId] ? <Image source={{ uri: urls[p.photoId] }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : <AppText style={{ fontSize: 12, color: colors.inkMuted48 }}>No photo</AppText>}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          {setA.weight && setB.weight && setA.weight !== setB.weight && (
            <View style={{ marginHorizontal: 16, marginTop: 24, backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, padding: 16, alignItems: "center" }}>
              <AppText style={{ fontSize: 12, fontWeight: "700", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4, fontFamily: ff(isArabic, 700) }}>{isArabic ? "تغير الوزن" : "WEIGHT DELTA"}</AppText>
              <AppText style={{ fontSize: 20, fontWeight: "700", fontVariant: ["tabular-nums"], color: setB.weight < setA.weight ? GREEN : RED }}>
                {convW(setB.weight) - convW(setA.weight) > 0 ? "+" : ""}{(convW(setB.weight) - convW(setA.weight)).toFixed(1)} {wUnit}
              </AppText>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title={isArabic ? "إضافة صورة" : "Add Photo"}>
        <View style={{ paddingTop: 4, paddingBottom: 24, gap: 12 }}>
          <Pressable onPress={() => pick("camera")} style={{ width: "100%", height: 56, borderRadius: 9999, backgroundColor: colors.primary, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Camera size={20} color={colors.onPrimary} />
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الكاميرا" : "Take Photo"}</AppText>
          </Pressable>
          <Pressable onPress={() => pick("library")} style={{ width: "100%", height: 56, borderRadius: 14, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Upload size={20} color={colors.inkMuted48} />
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "من المعرض" : "Choose from Gallery"}</AppText>
          </Pressable>
          <View style={{ marginTop: 16, width: "100%", height: 48, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Heart size={16} color={colors.inkMuted48} />
            <AppText style={{ fontSize: 14, fontWeight: "500", color: colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{isArabic ? "ربط Apple Health — قريبًا" : "Connect Apple Health — Soon"}</AppText>
          </View>
        </View>
      </BottomSheet>

      {/* Preview sheet */}
      <BottomSheet isOpen={showPreviewSheet} onClose={() => setShowPreviewSheet(false)} title={isArabic ? "حفظ الصورة" : "Save Photo"}>
        <View style={{ paddingTop: 4, paddingBottom: 24 }}>
          <View style={{ width: "100%", height: 300, backgroundColor: slot, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            {!!imgUri && <Image source={{ uri: imgUri }} style={{ width: "100%", height: "100%" }} contentFit="contain" />}
          </View>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, backgroundColor: cardBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline }}>
            <AppText style={{ fontSize: 14, fontWeight: "500", color: colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{isArabic ? "التاريخ" : "Date"}</AppText>
            <TextInput value={uploadDate} onChangeText={setUploadDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.inkMuted48} style={{ fontSize: 15, fontWeight: "700", color: colors.ink, fontVariant: ["tabular-nums"], minWidth: 130, textAlign: "center" }} />
          </View>
          <View style={{ flexDirection: "row", backgroundColor: toggleBg, padding: 4, borderRadius: 10, marginBottom: 24 }}>
            {ANGLES.map((ang) => {
              const sel = uploadAngle === ang;
              return (
                <Pressable key={ang} onPress={() => setUploadAngle(ang)} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: sel ? cardBg : "transparent", alignItems: "center" }}>
                  <AppText style={{ fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1.5, color: sel ? colors.ink : colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{ang}</AppText>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={handleSavePhoto} style={{ width: "100%", height: 56, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 16, fontWeight: "600", color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "حفظ الصورة" : "Save"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Off-screen full-res capture target (1080×1920 comparison card) */}
      {setA && setB && (
        <View style={{ position: "absolute", left: -99999, top: -99999 }} pointerEvents="none">
          <View ref={shareRef} collapsable={false}>
            <TemplateProgressComparison
              user={{ name: user.name || "Athlete", weightUnit: user.weightUnit }}
              isArabic={isArabic}
              setA={setA}
              setB={setB}
              urls={urls}
            />
          </View>
        </View>
      )}

      {/* Share sheet */}
      <BottomSheet isOpen={showShareSheet} onClose={() => setShowShareSheet(false)} title={isArabic ? "مشاركة المقارنة" : "Share Comparison"}>
        <View style={{ paddingTop: 4, paddingBottom: 24, alignItems: "center", gap: 24 }}>
          {setA && setB && (
            <View style={{ width: "100%", borderRadius: 16, borderWidth: 2, borderColor: colors.primary, padding: 12, gap: 8 }}>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
                {[setA, setB].map((s, i) => {
                  const p = s.photos.find((x) => x.angle === "front") || s.photos[0];
                  return (
                    <View key={i} style={{ flex: 1, aspectRatio: 3 / 4, backgroundColor: slot, borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                      {p && urls[p.photoId] ? <Image source={{ uri: urls[p.photoId] }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : <AppText style={{ fontSize: 12, color: colors.inkMuted48 }}>No photo</AppText>}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          <Pressable onPress={handleShareCapture} style={{ width: "100%", height: 56, borderRadius: 9999, backgroundColor: colors.primary, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Share2 size={20} color={colors.onPrimary} />
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "حفظ ومشاركة" : "Save & Share"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}
