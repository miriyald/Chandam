//---------------------------------------------------------------------------------------------
// <copyright file="R1.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//
// </copyright>
//---------------------------------------------------------------------------------------------

namespace Chandam.Rules.Rare
{
	public class Sree : Rule
	{
		public Sree()
		{
			Lines = 4;
			Threshold = 1;

			RuleType = RuleType.Name;
			PadyamType = PadyamType.Vruttam;
			PadyamSubType = PadyamSubType.Vruttam;
			YatiMode = YatiMode.CharPosition;


			Prasa = false;
			PrasaYati = false;

			Rules = new string[][] { new string[] { "గ" } };
			Yati = new int[][] { };


			Identifier = "Sree";
			Name = "శ్రీ (శ్రీః)";
			Examples = new string[] { "శ్రీ\nశ్రీం\nజే\nయున్", "శ్రీ\nభా\nవిం\nతున్‌." };
		}
	}
}
