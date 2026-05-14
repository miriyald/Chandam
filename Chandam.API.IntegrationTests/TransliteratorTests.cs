using Chandam.Indic.Transliteration;
using Xunit;

namespace Chandam.API.IntegrationTests;

public class TransliteratorTests
{
    [Theory]
    [InlineData("a", "అ")]
    [InlineData("A", "ఆ")]
    [InlineData("i", "ఇ")]
    [InlineData("I", "ఈ")]
    [InlineData("u", "ఉ")]
    [InlineData("U", "ఊ")]
    [InlineData("e", "ఎ")]
    [InlineData("E", "ఏ")]
    [InlineData("ai", "ఐ")]
    [InlineData("o", "ఒ")]
    [InlineData("O", "ఓ")]
    [InlineData("au", "ఔ")]
    public void ToTelugu_StandaloneVowels(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToTelugu(input));
    }

    [Theory]
    [InlineData("ka", "క")]
    [InlineData("kha", "ఖ")]
    [InlineData("ga", "గ")]
    [InlineData("gha", "ఘ")]
    [InlineData("cha", "చ")]
    [InlineData("Cha", "ఛ")]
    [InlineData("ja", "జ")]
    [InlineData("Ta", "ట")]
    [InlineData("Da", "డ")]
    [InlineData("Na", "ణ")]
    [InlineData("ta", "త")]
    [InlineData("tha", "థ")]
    [InlineData("da", "ద")]
    [InlineData("dha", "ధ")]
    [InlineData("na", "న")]
    [InlineData("pa", "ప")]
    [InlineData("pha", "ఫ")]
    [InlineData("ba", "బ")]
    [InlineData("bha", "భ")]
    [InlineData("ma", "మ")]
    [InlineData("ya", "య")]
    [InlineData("ra", "ర")]
    [InlineData("la", "ల")]
    [InlineData("La", "ళ")]
    [InlineData("va", "వ")]
    [InlineData("Sa", "శ")]
    [InlineData("sha", "ష")]
    [InlineData("sa", "స")]
    [InlineData("ha", "హ")]
    public void ToTelugu_ConsonantsWithInherentA(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToTelugu(input));
    }

    [Theory]
    [InlineData("ki", "కి")]
    [InlineData("kI", "కీ")]
    [InlineData("ku", "కు")]
    [InlineData("kU", "కూ")]
    [InlineData("ke", "కె")]
    [InlineData("kE", "కే")]
    [InlineData("kai", "కై")]
    [InlineData("ko", "కొ")]
    [InlineData("kO", "కో")]
    [InlineData("kau", "కౌ")]
    public void ToTelugu_ConsonantWithVowelMatra(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToTelugu(input));
    }

    [Theory]
    [InlineData("kka", "క్క")]
    [InlineData("gga", "గ్గ")]
    [InlineData("tta", "త్త")]
    [InlineData("ppa", "ప్ప")]
    [InlineData("sta", "స్త")]
    [InlineData("kra", "క్ర")]
    public void ToTelugu_Conjuncts(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToTelugu(input));
    }

    [Theory]
    [InlineData("aM", "అం")]
    [InlineData("kaM", "కం")]
    [InlineData("a@h", "అః")]
    public void ToTelugu_AnusvaraAndVisarga(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToTelugu(input));
    }

    [Theory]
    [InlineData("anka", "అంక")]
    [InlineData("anga", "అంగ")]
    [InlineData("ancha", "అంచ")]
    [InlineData("anda", "అంద")]
    [InlineData("amba", "అంబ")]
    public void ToTelugu_NasalConsonantSequences(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToTelugu(input));
    }

    [Theory]
    [InlineData("namaskAraM", "నమస్కారం")]
    [InlineData("telugu", "తెలుగు")]
    [InlineData("ChandaM", "ఛందం")]
    [InlineData("padyaM", "పద్యం")]
    [InlineData("kavita", "కవిత")]
    [InlineData("rAmuDu", "రాముడు")]
    public void ToTelugu_Words(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToTelugu(input));
    }

    [Fact]
    public void ToTelugu_EmptyAndNull()
    {
        Assert.Equal("", Transliterator.ToTelugu(""));
        Assert.Equal("", Transliterator.ToTelugu(null!));
    }

    [Theory]
    [InlineData("ka ga", "క గ")]
    [InlineData("ka.", "క.")]
    [InlineData("ka1", "క1")]
    public void ToTelugu_Passthrough(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToTelugu(input));
    }

    [Theory]
    [InlineData("క", "ka")]
    [InlineData("కి", "ki")]
    [InlineData("కీ", "kI")]
    [InlineData("కు", "ku")]
    [InlineData("కూ", "kU")]
    [InlineData("అ", "a")]
    [InlineData("ఆ", "A")]
    [InlineData("ఇ", "i")]
    public void ToRts_BasicConversion(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToRts(input));
    }

    [Theory]
    [InlineData("నమస్కారం", "namaskAraM")]
    [InlineData("తెలుగు", "telugu")]
    [InlineData("ఛందం", "ChaMdaM")]
    [InlineData("పద్యం", "padyaM")]
    [InlineData("రాముడు", "rAmuDu")]
    public void ToRts_Words(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToRts(input));
    }

    [Fact]
    public void ToRts_EmptyAndNull()
    {
        Assert.Equal("", Transliterator.ToRts(""));
        Assert.Equal("", Transliterator.ToRts(null!));
    }

    [Theory]
    [InlineData("క గ", "ka ga")]
    [InlineData("క.", "ka.")]
    [InlineData("క1", "ka1")]
    public void ToRts_Passthrough(string input, string expected)
    {
        Assert.Equal(expected, Transliterator.ToRts(input));
    }

    [Theory]
    [InlineData("namaskAraM")]
    [InlineData("telugu")]
    [InlineData("ChaMdaM")]
    [InlineData("padyaM")]
    [InlineData("kavita")]
    [InlineData("rAmuDu")]
    public void RoundTrip_RtsToTeluguAndBack(string rts)
    {
        var telugu = Transliterator.ToTelugu(rts);
        var backToRts = Transliterator.ToRts(telugu);
        Assert.Equal(rts, backToRts);
    }
}
