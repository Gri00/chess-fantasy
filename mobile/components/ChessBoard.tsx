import { View, Text, StyleSheet } from "react-native";
import { C } from "../constants/Colors";

const PIECE_UNICODE: Record<string, string> = {
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
};

function parseFenPosition(fen: string): (string | null)[][] {
  const position = fen.split(" ")[0];
  return position.split("/").map((rank) => {
    const row: (string | null)[] = [];
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch); i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    return row;
  });
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const CELL_SIZE = 40;

export default function ChessBoard({ fen }: { fen: string }) {
  const board = parseFenPosition(fen);
  return (
    <View style={s.container}>
      <View style={s.board}>
        {board.map((rank, rankIdx) => (
          <View key={rankIdx} style={s.rank}>
            <Text style={s.rankLabel}>{8 - rankIdx}</Text>
            {rank.map((piece, fileIdx) => {
              const isLight = (rankIdx + fileIdx) % 2 === 0;
              const isWhitePiece = piece ? piece === piece.toUpperCase() : false;
              return (
                <View key={fileIdx} style={[s.cell, isLight ? s.cellLight : s.cellDark]}>
                  {piece && (
                    <Text style={[s.piece, isWhitePiece ? s.pieceWhite : s.pieceBlack]}>
                      {PIECE_UNICODE[piece] ?? piece}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
        <View style={s.fileRow}>
          <View style={s.rankLabelSpacer} />
          {FILES.map((f) => (
            <Text key={f} style={s.fileLabel}>{f}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: "center" },
  board: { borderWidth: 1, borderColor: C.gold33, borderRadius: 6, overflow: "hidden" },
  rank: { flexDirection: "row", alignItems: "center" },
  rankLabel: { width: 18, textAlign: "center", color: C.white35, fontSize: 9, backgroundColor: "#0a0a18" },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: "center", justifyContent: "center" },
  cellLight: { backgroundColor: "#f0d9b5" },
  cellDark:  { backgroundColor: "#b58863" },
  piece:      { fontSize: 26, lineHeight: 34 },
  pieceWhite: { color: "#fff", textShadowColor: "#000", textShadowOffset: { width: 0.5, height: 0.5 }, textShadowRadius: 1 },
  pieceBlack: { color: "#1a1a1a" },
  fileRow: { flexDirection: "row", backgroundColor: "#0a0a18", paddingVertical: 3 },
  rankLabelSpacer: { width: 18 },
  fileLabel: { width: CELL_SIZE, textAlign: "center", color: C.white35, fontSize: 9 },
});
