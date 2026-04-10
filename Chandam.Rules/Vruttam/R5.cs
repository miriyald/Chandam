//---------------------------------------------------------------------------------------------
// <copyright file="R5.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//
// </copyright>
//---------------------------------------------------------------------------------------------

namespace Chandam.Rules.Rare
{
	public class paMkti : Rule
	{
		public paMkti()
		{
			Lines = 4;
			Threshold = 3;

			RuleType = RuleType.Name;
			PadyamType = PadyamType.Vruttam;
			PadyamSubType = PadyamSubType.Vruttam;
			YatiMode = YatiMode.CharPosition;


			Prasa = true;
			PrasaYati = false;
			Rules = new string[][] { "భ,గా".Split(',') };

			Yati = new int[][] { };


			Identifier = "paMkti";
			Name = "పంక్తి-1 (సుందరి-1, అక్షరోపపదా, అక్షరపంక్తి, కాంచనమాలా, కుంతలతన్వీ, భూతలతన్వీ, హంసా, పఙ్క్తిః)";
			Examples = new string[] { "సుందరి యొప్పుం\nజెంది భగా నిం\nపొంద నియుక్తిన్\nగందుకలీలన్", "చెంది భకారం\nబొదగగంబుల్\nసుందరి యంపే\nరందురు సూరుల్" };
		}
	}
	public class sati : Rule
	{
		public sati()
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

			Rules = new string[][] { new string[] { "జ", "గా" } };
			Yati = new int[][] { };

			Identifier = "sati";
			Name = "సతి (కణ్ఠీ)";

			Examples = new string[] { "సతీత్వధర్మ\nప్రతిష్ఠనార్యా\nసతీవిశిష్ఠా\nత్మతత్వమెంతున్" };
		}
	}
	public class preeti : Rule
	{
		public preeti()
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

			Rules = new string[][] { new string[] { "ర", "గా" } };
			Yati = new int[][] { };

			Identifier = "preeti";
			Name = "ప్రీతి (సూరిణీ)";

			Examples = new string[] { "ప్రీతిమై చేత\nస్సాతతోన్మేషన్\nద్యోతమౌ శాంతిన్\nపూతభావాప్తిన్" };
		}
	}
	public class praguNa : Rule
	{
		public praguNa()
		{
			Lines = 4;
			Threshold = 3;

			RuleType = RuleType.Name;
			PadyamType = PadyamType.Vruttam;
			YatiMode = YatiMode.CharPosition;


			Prasa = true;
			PrasaYati = false;

			Rules = new string[][] {
										"స,గా".Split ( ',' ),
									};
			Yati = new int[][] { };
			Examples = new string[] { "సగణాసక్తిం\nగగసంయుక్తిన్\nబ్రగుణాఖ్యంబై\nతగు నింపారన్" };

			PadyamSubType = PadyamSubType.Vruttam;
			Identifier = "praguNa";
			Name = "ప్రగుణ";

		}
	}

	public class naMda : Rule
	{
		public naMda()
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

			Rules = new string[][] { new string[] { "త", "వ" } };
			Yati = new int[][] { };

			Identifier = "naMda";
			Name = "నంద (కణికా)";
			Examples = new string[] { "వందింతును నే\nనందాత్మజు నా\nనందంబున స్వ\nఛ్ఛందప్రణతిన్" };
		}
	}
	public class aMbuja : Rule
	{
		public aMbuja()
		{
			Lines = 4;
			Threshold = 3;

			RuleType = RuleType.Name;
			PadyamType = PadyamType.Vruttam;
			PadyamSubType = PadyamSubType.Vruttam;
			YatiMode = YatiMode.CharPosition;


			Prasa = true;
			PrasaYati = false;

			Rules = new string[][] { new string[] { "భ", "వ" } };
			Yati = new int[][] { };


			Identifier = "aMbuja";
			Name = "అంబుజ (మణ్డలమ్)";
			Examples = new string[] { "ఇంబగు భకా\nరంబును వకా\n	రంబును జుమీ\nయంబుజ మగున్.", "ఇంబులభకా\nరంబును లగం\nనుం బొనరగా\nనంబుజమగున్", "వందింతును నే\nనందాత్మజునా\nనందంబున స్వ\nఛ్చందప్రణతిన్" };
		}
	}
	public class valamuri : Rule
	{
		public valamuri()
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
			Rules = new string[][] { new string[] { "న", "వ" } };
			Yati = new int[][] { };
			Identifier = "valamuri";
			Name = "వలమురి(సులూః)";
			Examples = new string[] { "నలగ పదం\nబలవడఁగా\nవలమురియౌ\nజలదనిభా" };
		}
	}
}