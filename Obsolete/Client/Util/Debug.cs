//---------------------------------------------------------------------------------------------
// <copyright file="Debug.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:38EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

using System;
using System.Html;

namespace Chandam.Util
{
	public class MathHelper
	{
		public static int Ceil(Number c)
		{
			return (int)Math.Ceil(c);
		}

		public static int Floor(Number c)
		{
			return (int)Math.Floor(c);
		}
	}

	public class Debug2
	{
		public static void Write(string s)
		{
			if (Window.Location.Href.ToString().IndexOf("localhost") > 0)
			{
				Document.GetElementById("debug").InnerHTML = s;
			}
		}

		public static void AppendLine(string s)
		{
			if (Window.Location.Href.ToString().IndexOf("localhost") > 0)
			{
				Document.GetElementById("debug").InnerHTML = Document.GetElementById("debug").InnerHTML + "<br/>" + s;
			}
		}
	}
}
