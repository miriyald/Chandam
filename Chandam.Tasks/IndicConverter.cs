using System;
using System.Text;
using System.Globalization;


namespace Verifier.Services.Indic
{
    public class Indic
    {
        public enum Language
        {
            Hindi = 57002,
            Telugu = 57005,
            Kannada= 57008
        }
        public enum LangType
        {
            Indic = 0,
            Mixture = 1,
            English = 2
        }


        public static LangType Analyse(string PureString)
        {


            string[] Words = PureString.Split(' ');
            bool indic = false, english = false;

            foreach (string Word in Words)
            {
                if (Word.Length == 0) continue;

                char First = Word[0];
                UnicodeCategory UC = Char.GetUnicodeCategory(First);



                if (UC == UnicodeCategory.OtherLetter)
                {
                    indic = true;

                }
                if (UC == UnicodeCategory.LowercaseLetter || UC == UnicodeCategory.UppercaseLetter)
                {
                    english = true;
                }


                if (indic && english) break;
            }
            if (indic && !english) { return LangType.Indic; }
            if (!indic && english) { return LangType.English; }
            return LangType.Mixture;

        }

    }
    public class Converter
    {



        public static string Convert(string S, Indic.Language From, Indic.Language To)
        {
            if (S == null) { return null; }
            try
            {



                Encoding encFrom = Encoding.GetEncoding((int)From);
                Encoding encTo = Encoding.GetEncoding((int)To);
                string str = S;
                Byte[] b = encFrom.GetBytes(str);
                return encTo.GetString(b);
            }
            catch { return null; }
        }

        public static string UniCode2ISCII(string S, Indic.Language L)
        {

            if (S == null) { return null; }
            try
            {



                Encoding encFrom = Encoding.GetEncoding((int)L);
                Encoding encTo = Encoding.GetEncoding(1252);
                string str = S;
                Byte[] b = encFrom.GetBytes(str);
                return encTo.GetString(b);
            }
            catch { return null; }
        }
    }
}