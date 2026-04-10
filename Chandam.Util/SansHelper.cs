//---------------------------------------------------------------------------------------------
// <copyright file="SansHelper.cs" company="Chandam-ఛందం">
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
	public partial class RuleHelper
	{
		/// <summary>
		/// Sanskrit rules source — set by the application at startup
		/// (e.g., SanskritRules.Rules from Chandam.Rules)
		/// </summary>
		private static Rule[] _sanRules = new Rule[0];

		public static void RegisterSanskritRules(Rule[] rules)
		{
			_sanRules = rules;
		}

		public static Rule[] GetSanRules()
		{
			return _sanRules;
		}

		/// <summary>
		/// Gets all the Rules with given Padyam Sub Type
		/// </summary>
		/// <param name="C"></param>
		/// <returns></returns>
		public static Rule[] GetSansRules2(PadyamSubType C)
		{
			Rule[] Rules = GetSanRules3();
			List<Rule> L = new List<Rule>();

			foreach (Rule R in Rules)
			{
				if (R.PadyamSubType == C)
				{
					L.Add(R);
				}
			}

			Rule[] Rules2 = new Rule[L.Count];
			for (int i = 0; i < L.Count; i++)
			{
				Rules2[i] = L[i];
			}

			return Rules2;
		}
		public static Rule[] GetSanRules3()
		{
			Rule[] Rules = GetSanRules();
			List<Rule> L = new List<Rule>();

			foreach (Rule R in Rules)
			{
				if (R.PadyamType == PadyamType.Vruttam)
				{
					if (R.CharLength >= 1 && R.CharLength <= 26)
					{

					}
					else
					{
						L.Add(R);
					}
				}
			}

			Rule[] Rules2 = new Rule[L.Count];
			for (int i = 0; i < L.Count; i++)
			{
				Rules2[i] = L[i];
			}

			return Rules2;


		}
		public static Rule[] GetSanRules2(int l)
		{
			Rule[] Rules = GetSanRules();
			List<Rule> L = new List<Rule>();

			foreach (Rule R in Rules)
			{
				if (R.PadyamType == PadyamType.Vruttam)
				{
					if (R.CharLength == l)
					{
						L.Add(R);
					}
				}
			}

			Rule[] Rules2 = new Rule[L.Count];
			for (int i = 0; i < L.Count; i++)
			{
				Rules2[i] = L[i];
			}

			return Rules2;


		}
	}
}