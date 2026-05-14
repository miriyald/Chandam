using System.Collections.Generic;
using System.Text;

namespace Chandam.Indic.Transliteration;

/// <summary>
/// Converts between RTS (Rice Transliteration Scheme) Roman text and Telugu Unicode.
/// </summary>
public static class Transliterator
{
    private const int TeluguBase = 0x0C00;
    private const int HalantOffset = 0x4D;
    private const int Halant = TeluguBase + HalantOffset;

    // Vowel: code -> (independent_offset, matra_offset)
    private static readonly Dictionary<int, (int Independent, int Matra)> VowelMap = new()
    {
        [2]  = (0x05, 0x3E), // a
        [3]  = (0x06, 0x3E), // A
        [4]  = (0x07, 0x3F), // i
        [5]  = (0x08, 0x40), // I
        [6]  = (0x09, 0x41), // u
        [7]  = (0x0A, 0x42), // U
        [8]  = (0x0B, 0x43), // R (vocalic r)
        [9]  = (0x60, 0x44), // RR
        [10] = (0x0C, 0x62), // ~l
        [11] = (0x61, 0x63), // ~L
        [13] = (0x0E, 0x46), // e
        [14] = (0x0F, 0x47), // E
        [15] = (0x10, 0x48), // ai
        [17] = (0x12, 0x4A), // o
        [18] = (0x13, 0x4B), // O
        [19] = (0x14, 0x4C), // au
    };

    // Consonant: code -> offset
    private static readonly Dictionary<int, int> ConsonantMap = new()
    {
        [101] = 0x15, [102] = 0x16, [103] = 0x17, [104] = 0x18,
        [105] = 0x19, [106] = 0x1A, [107] = 0x1B, [108] = 0x1C,
        [109] = 0x1D, [110] = 0x1E, [111] = 0x1F, [112] = 0x20,
        [113] = 0x21, [114] = 0x22, [115] = 0x23, [116] = 0x24,
        [117] = 0x25, [118] = 0x26, [119] = 0x27, [120] = 0x28,
        [122] = 0x2A, [123] = 0x2B, [124] = 0x2C, [125] = 0x2D,
        [126] = 0x2E, [127] = 0x2F, [128] = 0x30, [129] = 0x31,
        [130] = 0x32, [131] = 0x33, [133] = 0x35, [134] = 0x36,
        [135] = 0x37, [136] = 0x38, [137] = 0x39,
    };

    // Mark: code -> offset
    private static readonly Dictionary<int, int> MarkMap = new()
    {
        [200] = 0x01, [201] = 0x01, [202] = 0x02, [203] = 0x03, [204] = 0x3D,
    };

    /// <summary>
    /// Converts RTS Roman text to Telugu Unicode.
    /// Example: "namaskAraM" -> "నమస్కారం"
    /// </summary>
    public static string ToTelugu(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        var hash = RtsTable.Hash;
        var output = new StringBuilder(input.Length * 2);
        bool matraPending = false;
        int i = 0;
        int len = input.Length;

        while (i < len)
        {
            bool matched = false;

            // Greedy longest-match: try 3, 2, 1 chars
            for (int size = 3; size > 0; size--)
            {
                if (i + size > len) continue;
                string substr = input.Substring(i, size);

                if (hash.TryGetValue(substr, out int[] codes))
                {
                    foreach (int code in codes)
                    {
                        EncodePhoneme(output, code, ref matraPending);
                    }
                    i += size;
                    matched = true;
                    break;
                }
            }

            if (!matched)
            {
                if (matraPending)
                {
                    output.Append((char)Halant);
                    matraPending = false;
                }
                output.Append(input[i]);
                i++;
            }
        }

        if (matraPending)
        {
            output.Append((char)Halant);
        }

        return output.ToString();
    }

    /// <summary>
    /// Converts Telugu Unicode text to RTS Roman equivalent.
    /// Example: "నమస్కారం" -> "namaskAraM"
    /// </summary>
    public static string ToRts(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        var arr = RtsTable.ReverseArray;
        var output = new StringBuilder(input.Length * 2);
        bool matraPending = false;

        for (int i = 0; i < input.Length; i++)
        {
            int ch = input[i];

            if (ch < TeluguBase || ch > TeluguBase + 0x7F)
            {
                if (matraPending)
                {
                    output.Append('a');
                    matraPending = false;
                }
                output.Append(input[i]);
                continue;
            }

            int offset = ch - TeluguBase;

            // Halant: cancels inherent 'a'
            if (offset == HalantOffset)
            {
                matraPending = false;
                continue;
            }

            // Consonant range: 0x15-0x39
            if (offset >= 0x15 && offset <= 0x39)
            {
                if (matraPending)
                {
                    output.Append('a');
                }
                if (offset < arr.Length && arr[offset] != null)
                {
                    output.Append(arr[offset]);
                }
                matraPending = true;
                continue;
            }

            // Matra (dependent vowel) range: 0x3E-0x4C, 0x62-0x63
            if ((offset >= 0x3E && offset <= 0x4C) || (offset >= 0x62 && offset <= 0x63))
            {
                matraPending = false;
                if (offset < arr.Length && arr[offset] != null)
                {
                    output.Append(arr[offset]);
                }
                continue;
            }

            // Standalone vowel, mark, or other
            if (matraPending)
            {
                output.Append('a');
                matraPending = false;
            }
            if (offset < arr.Length && arr[offset] != null)
            {
                output.Append(arr[offset]);
            }
        }

        if (matraPending)
        {
            output.Append('a');
        }

        return output.ToString();
    }

    private static void EncodePhoneme(StringBuilder output, int code, ref bool matraPending)
    {
        // Special marks (anusvara, visarga, etc.)
        if (code >= 200 && code <= 205)
        {
            if (MarkMap.TryGetValue(code, out int markOffset))
            {
                output.Append((char)(TeluguBase + markOffset));
            }
            matraPending = false;
            return;
        }

        // Vowels
        if (code >= 2 && code <= 19)
        {
            if (!VowelMap.TryGetValue(code, out var vowel))
                return;

            if (matraPending)
            {
                if (code == 2)
                {
                    // 'a' is inherent — no matra needed
                    matraPending = false;
                    return;
                }
                output.Append((char)(TeluguBase + vowel.Matra));
            }
            else
            {
                output.Append((char)(TeluguBase + vowel.Independent));
            }
            matraPending = false;
            return;
        }

        // Consonants
        if (code >= 101 && code <= 147)
        {
            if (!ConsonantMap.TryGetValue(code, out int conOffset))
                return;

            if (matraPending)
            {
                output.Append((char)Halant);
            }
            output.Append((char)(TeluguBase + conOffset));
            matraPending = true;
            return;
        }

        // Control codes
        if (code == 253 || code == 254)
        {
            if (matraPending)
            {
                output.Append((char)Halant);
                matraPending = false;
            }
        }
    }
}
