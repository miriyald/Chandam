//---------------------------------------------------------------------------------------------
// <copyright file="Prasa.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//
// </copyright>
//---------------------------------------------------------------------------------------------

namespace Chandam.Core
{
	public class Prasa
	{
		private string _Symbol;
		public string Symbol
		{
			get
			{
				return _Symbol;
			}
			set
			{
				_Symbol = value;
			}
		}
		private string _Poorva;
		public string Poorva
		{
			get
			{
				return _Poorva;
			}
			set
			{
				_Poorva = value;
			}
		}
		private string _Value;
		public string Value
		{
			get
			{
				return _Value;
			}
			set
			{
				_Value = value;
			}
		}


		private bool _f;
		public bool IsAnthyaPrasa
		{
			get
			{
				return _f;
			}
			set
			{
				_f = value;
			}
		}

		public Prasa(string PoorvaSymbol, bool isAnthyaPrasa, string val, string PoorvaVal)
		{
			Symbol = PoorvaSymbol;
			IsAnthyaPrasa = isAnthyaPrasa;
			Value = val;
			Poorva = PoorvaVal;
		}
	}
}
