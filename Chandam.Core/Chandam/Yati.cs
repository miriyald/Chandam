//---------------------------------------------------------------------------------------------
// <copyright file="Yati.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//
// </copyright>
//---------------------------------------------------------------------------------------------

using System.Collections.Generic;

namespace Chandam.Core
{
	public class Yati
	{
		public string P1;
		public string PY1;
		public string YC;
		public List<string> P2;
		public List<string> PrasaYati;
		public List<string> PrevContext;

		public Yati()
		{
			P2 = new List<string>();
			Positions = new List<int>();
			PrasaYati = new List<string>();
			PrevContext = new List<string>();
		}
		public List<int> Positions;

	}
}
