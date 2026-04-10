//---------------------------------------------------------------------------------------------
// <copyright file="StringUtil2.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:34EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

namespace Chandam.Util
{
	public partial class StringPlus
	{
		public static string TrimEnd(string s, char c)
		{
			return s.TrimEnd(c);
		}
		public static char[] ToCharArray(string s)
		{
			return s.ToCharArray();
		}
		public static char CharAt(string MatchString, int index)
		{
			return MatchString[index];
		}
		public static string SubString(string s, int startIndex, int length)
		{
			return s.Substring(startIndex, length);
		}

	}
}
