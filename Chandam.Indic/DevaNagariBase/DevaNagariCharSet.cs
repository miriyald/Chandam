//---------------------------------------------------------------------------------------------
// <copyright file="DevaNagariCharSet.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:36EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

namespace Chandam.Indic
{
	public class DevanagariCharSet : iIndicCharSet
	{
		public string NewLineSet
		{
			get
			{
				return "\n";
			}
		}
		public string SapceSet
		{
			get
			{
				return " ";
			}
		}
		public string IgnoreSet
		{
			get
			{
				return " \n";
			}
		}
		public string AchchuSet
		{
			get
			{
				return "अआइईउऊऋऎएऌऐऒओऔॠ";
			}
		}
		public string HalluSet
		{
			get
			{
				return "कखगघ" +
			 "ङचछजझञ" +
			 "टठडढण" +
			 "तथदधन" +
			 "पफबभम" +
			 "यरऱलळव" +
			 "शषसह";
			}
		}
		public string NumberSet
		{
			get
			{
				return "०१२३४५६७८९";
			}
		}
		public char PolluSet
		{
			get
			{
				return '्';
			}
		}
		public string SmallAchchuSet
		{
			get
			{
				return "अइउऋऎऌऒ";
			}
		}
		public char Reph
		{
			get
			{
				return 'र';
			}
		}
		public string SpecialFinishSet
		{
			get
			{
				return "ंः";
			}
		}
		public string SpecialAkshar
		{
			get
			{
				return "न्,";
			}
		}
		public string SmallFinishingSet
		{
			get
			{
				return "िुृॆॊ";
			}
		}
		public string FinishingSet
		{
			get
			{
				return "ािीुूृॄॆेैॊोौंः";
			}
		}
		public string NeutralSet
		{
			get
			{
				return "ँ";
			}
		}

		public int UnicodeFrom
		{
			get
			{
				return 2305;
			}
		}

		public int UnicodeTo
		{
			get
			{
				//return 2305 + 128;
				return 2433;
			}
		}

		public char Special2
		{
			get
			{
				return 'Z';
			}
		}

		public IndicChar NewChar
		{
			get
			{
				return new IndicChar(this);
			}
		}
	}
}