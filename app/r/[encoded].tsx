/** Route: /r/[encoded] → ImportRoutine (shareable routine deep link). */
import { useLocalSearchParams } from "expo-router";
import ImportRoutine from "../../src/screens/ImportRoutine";

export default function SharedRoutineRoute() {
  const { encoded } = useLocalSearchParams<{ encoded?: string }>();
  return <ImportRoutine encoded={encoded} />;
}
