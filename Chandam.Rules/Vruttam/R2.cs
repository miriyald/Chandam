//---------------------------------------------------------------------------------------------
// <copyright file="R2.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//
// </copyright>
//---------------------------------------------------------------------------------------------

namespace Chandam.Rules.Rare
{
	public class stree : Rule
	{
		public stree()
		{
			Lines = 4;
			Threshold = 2;

			RuleType = RuleType.Name;
			PadyamType = PadyamType.Vruttam;
			YatiMode = YatiMode.CharPosition;
			PadyamSubType = PadyamSubType.Vruttam;

			Prasa = true;
			PrasaYati = false;

			Rules = new string[][] { "గా".Split(',') };
			Yati = new int[][] { };


			Identifier = "stree";
			Name = "స్త్రీ";
			Examples = new string[] { "స్త్రీరూ\nపారున్‌\nఘోరా\nఘోరీ.", "స్త్రీరూ\nపారుం\nగారూ\nపారున్" };
		}
	}
}
