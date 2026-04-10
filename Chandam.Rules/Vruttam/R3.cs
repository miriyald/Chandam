//---------------------------------------------------------------------------------------------
// <copyright file="R3.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//
// </copyright>
//---------------------------------------------------------------------------------------------

namespace Chandam.Rules.Rare
{
	public class mRgi : Rule
	{
		public mRgi()
		{
			Lines = 4;
			Threshold = 3;

			RuleType = RuleType.Name;
			PadyamType = PadyamType.Vruttam;
			PadyamSubType = PadyamSubType.Vruttam;
			YatiMode = YatiMode.CharPosition;

			Prasa = true;
			PrasaYati = false;
			AnthyaPrasa = false;

			Rules = new string[][] { new string[] { "ర" } };
			Yati = new int[][] { };

			Identifier = "mRgi";
			Name = "మృగీ";
			Examples = new string[] { "విన్ము రే\nఫన్మృగీ\nమున్ముగాఁ\nజిన్మయా" };
		}
	}
	public class naaree : Rule
	{
		public naaree()
		{
			Lines = 4;
			Threshold = 3;

			RuleType = RuleType.Name;
			PadyamType = PadyamType.Vruttam;
			YatiMode = YatiMode.CharPosition;


			Prasa = true;
			PrasaYati = false;

			Rules = new string[][] { new string[] { "మ" } };
			Yati = new int[][] { };

			PadyamSubType = PadyamSubType.Vruttam;
			Identifier = "naaree";
			Name = "నారీ (జన, పుష్ప, మద, మధు, బలి)";
			Examples = new string[] { "నారీవృ\nత్తారంభం\nబారున్మా\nకారం బై", "నారీలో\nకారాధ్యా\nసారస్యా\nధారాధ్యా" };
		}
	}
	public class vinayaM : Rule
	{
		public vinayaM()
		{
			Lines = 4;
			Threshold = 3;

			RuleType = RuleType.Name;
			PadyamType = PadyamType.Vruttam;
			YatiMode = YatiMode.CharPosition;
			PadyamSubType = PadyamSubType.Vruttam;

			Prasa = true;
			PrasaYati = false;
			Rules = new string[][] { new string[] { "స" } };

			Yati = new int[][] { };


			Identifier = "vinayaM";
			Name = "వినయము (రమణః)";
			Examples = new string[] { "వినయం\n	బొనరిం\n	తు ననం\nతునకున్‌." };
		}
	}
}
