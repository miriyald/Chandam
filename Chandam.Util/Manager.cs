//---------------------------------------------------------------------------------------------
// <copyright file="Manager.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:35EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

using System.Collections.Generic;

namespace Chandam.Rules
{
	public class Manager
	{
		private static Dictionary<string, Rule> LoadedList = new Dictionary<string, Rule>();

		public static void Register(Rule[] TeluguRules)
		{
			if (LoadedList != null)
			{
				foreach (Rule R in TeluguRules)
				{
					AddRule(R);
				}
			}
		}

		public static void Clear()
		{
			LoadedList = new Dictionary<string, Rule>();
		}


		public static void AddRule(Rule R)
		{
			LoadedList[R.Identifier] = R;
		}


		public static Rule FetchRule(string identifier)
		{
			if (!LoadedList.ContainsKey(identifier))
			{
				return null;
			}
			return LoadedList[identifier];
		}

		public static Rule[] Rules()
		{
			Rule[] List = new Rule[LoadedList.Count];
			int cnt = 0;
			foreach (string R in LoadedList.Keys)
			{
				List[cnt++] = LoadedList[R];
			}

			return List;
		}
	}
}
