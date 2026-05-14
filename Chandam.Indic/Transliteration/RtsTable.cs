using System.Collections.Generic;

namespace Chandam.Indic.Transliteration;

/// <summary>
/// RTS (Rice Transliteration Scheme) lookup tables for Telugu.
/// Maps Roman input sequences to internal phoneme codes and back.
/// </summary>
internal static class RtsTable
{
    // Internal phoneme code ranges:
    //   2-19: vowels
    //   101-147: consonants
    //   200-205: special marks
    //   252-255: control codes

    internal static readonly Dictionary<string, int[]> Hash = BuildHash();
    internal static readonly string[] ReverseArray = BuildReverseArray();

    private static Dictionary<string, int[]> BuildHash()
    {
        var h = new Dictionary<string, int[]>();

        void S(string key, int code) => h[key] = new[] { code };
        void M(string key, params int[] codes) => h[key] = codes;

        // Vowels
        S("a", 2);
        S("a'", 3); S("A", 3); S("aa", 3);
        S("i", 4);
        S("i'", 5); S("I", 5); S("ee", 5); S("ii", 5);
        S("u", 6);
        S("u'", 7); S("U", 7); S("uu", 7); S("oo", 7);
        S("R", 8);
        S("Ru", 9);
        S("~l", 10);
        S("~L", 11);
        S("e", 13);
        S("e'", 14); S("E", 14); S("ea", 14);
        S("ai", 15);
        S("o", 17);
        S("o'", 18); S("O", 18); S("oa", 18);
        S("au", 19); S("ou", 19);

        // Special marks
        S("@M", 201); S("@m", 201);
        S("M", 202);
        S("@h", 203);
        S("@2", 204);

        // Consonants
        S("k", 101);
        S("kh", 102); S("K", 102);
        S("g", 103);
        S("gh", 104); S("G", 104);
        S("~m", 105);
        S("ch", 106); S("c", 106);
        S("Ch", 107); S("C", 107);
        S("j", 108);
        S("jh", 109); S("J", 109);
        S("~n", 110);
        S("T", 111);
        S("Th", 112);
        S("D", 113);
        S("Dh", 114);
        S("N", 115);
        S("t", 116);
        S("th", 117);
        S("d", 118);
        S("dh", 119);
        S("n", 120);
        S("p", 122);
        S("ph", 123); S("f", 123); S("P", 123);
        S("b", 124);
        S("bh", 125); S("B", 125);
        S("m", 126);
        S("y", 127);
        S("r", 128);
        S("~r", 129);
        S("l", 130);
        S("L", 131);
        S("v", 133); S("w", 133);
        S("S", 134);
        S("sh", 135);
        S("s", 136);
        S("h", 137);

        // Nasal+consonant sequences (anusvara + consonant)
        M("nk", 202, 101); M("nkh", 202, 102); M("nK", 202, 102);
        M("ng", 202, 103); M("ngh", 202, 104); M("nG", 202, 104);
        M("nc", 202, 106); M("nch", 202, 106);
        M("nCh", 202, 107); M("nC", 202, 107);
        M("nj", 202, 108); M("njh", 202, 109); M("nJ", 202, 109);
        M("nT", 202, 111); M("nTh", 202, 112);
        M("nD", 202, 113); M("nDh", 202, 114);
        M("nt", 202, 116); M("nth", 202, 117);
        M("nd", 202, 118); M("ndh", 202, 119);
        M("np", 202, 122); M("nph", 202, 123); M("nf", 202, 123); M("nP", 202, 123);
        M("nb", 202, 124); M("nbh", 202, 125); M("nB", 202, 125);
        M("nS", 202, 134); M("nsh", 202, 135); M("ns", 202, 136);

        M("mk", 202, 101); M("mkh", 202, 102); M("mK", 202, 102);
        M("mg", 202, 103); M("mgh", 202, 104); M("mG", 202, 104);
        M("mc", 202, 106); M("mch", 202, 106);
        M("mCh", 202, 107); M("mC", 202, 107);
        M("mj", 202, 108); M("mjh", 202, 109); M("mJ", 202, 109);
        M("mT", 202, 111); M("mTh", 202, 112);
        M("mD", 202, 113); M("mDh", 202, 114);
        M("mt", 202, 116); M("mth", 202, 117);
        M("md", 202, 118); M("mdh", 202, 119);
        M("mp", 202, 122); M("mph", 202, 123); M("mf", 202, 123); M("mP", 202, 123);
        M("mb", 202, 124); M("mbh", 202, 125); M("mB", 202, 125);
        M("mS", 202, 134); M("msh", 202, 135); M("ms", 202, 136);
        M("mv", 202, 133); M("mw", 202, 133);

        // Combined sounds
        M("x", 101, 135); // ksha

        // Control
        S("#", 255);
        S("^", 254);
        S("&", 253);
        S("_", 252);

        return h;
    }

    private static string[] BuildReverseArray()
    {
        // Indexed by Unicode offset within script block
        var arr = new string[88];
        arr[0x01] = "@M";  // chandrabindu
        arr[0x02] = "M";   // anusvara
        arr[0x03] = "@h";  // visarga
        arr[0x05] = "a";   // అ
        arr[0x06] = "A";   // ఆ
        arr[0x07] = "i";   // ఇ
        arr[0x08] = "I";   // ఈ
        arr[0x09] = "u";   // ఉ
        arr[0x0A] = "U";   // ఊ
        arr[0x0B] = "R";   // ఋ
        arr[0x0C] = "~l";  // ఌ
        arr[0x0E] = "e";   // ఎ
        arr[0x0F] = "E";   // ఏ
        arr[0x10] = "ai";  // ఐ
        arr[0x12] = "o";   // ఒ
        arr[0x13] = "O";   // ఓ
        arr[0x14] = "au";  // ఔ
        arr[0x15] = "k";   // క
        arr[0x16] = "kh";  // ఖ
        arr[0x17] = "g";   // గ
        arr[0x18] = "gh";  // ఘ
        arr[0x19] = "~m";  // ఙ
        arr[0x1A] = "ch";  // చ
        arr[0x1B] = "Ch";  // ఛ
        arr[0x1C] = "j";   // జ
        arr[0x1D] = "jh";  // ఝ
        arr[0x1E] = "~n";  // ఞ
        arr[0x1F] = "T";   // ట
        arr[0x20] = "Th";  // ఠ
        arr[0x21] = "D";   // డ
        arr[0x22] = "Dh";  // ఢ
        arr[0x23] = "N";   // ణ
        arr[0x24] = "t";   // త
        arr[0x25] = "th";  // థ
        arr[0x26] = "d";   // ద
        arr[0x27] = "dh";  // ధ
        arr[0x28] = "n";   // న
        arr[0x2A] = "p";   // ప
        arr[0x2B] = "ph";  // ఫ
        arr[0x2C] = "b";   // బ
        arr[0x2D] = "bh";  // భ
        arr[0x2E] = "m";   // మ
        arr[0x2F] = "y";   // య
        arr[0x30] = "r";   // ర
        arr[0x31] = "~r";  // ఱ
        arr[0x32] = "l";   // ల
        arr[0x33] = "L";   // ళ
        arr[0x35] = "v";   // వ
        arr[0x36] = "S";   // శ
        arr[0x37] = "sh";  // ష
        arr[0x38] = "s";   // స
        arr[0x39] = "h";   // హ

        // Matra (dependent vowel) offsets
        arr[0x3E] = "A";   // ా
        arr[0x3F] = "i";   // ి
        arr[0x40] = "I";   // ీ
        arr[0x41] = "u";   // ు
        arr[0x42] = "U";   // ూ
        arr[0x43] = "R";   // ృ
        arr[0x44] = "Ru";  // ౄ
        arr[0x46] = "e";   // ె
        arr[0x47] = "E";   // ే
        arr[0x48] = "ai";  // ై
        arr[0x4A] = "o";   // ొ
        arr[0x4B] = "O";   // ో
        arr[0x4C] = "au";  // ౌ

        return arr;
    }
}
