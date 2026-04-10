//---------------------------------------------------------------------------------------------
// <copyright file="Probable.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//
// </copyright>
//---------------------------------------------------------------------------------------------

using Chandam.Rules;
using System.Collections.Generic;


namespace Chandam.Core
{
	public class Probable
	{
		MatchResult _M;
		Padyam _P;
		Rule _R;
		List<MatchResult> _Candidates;

		public List<MatchResult> Candiates
		{
			get
			{
				return _Candidates;
			}
			set
			{
				_Candidates = value;
			}
		}
		public MatchResult MatchResult
		{
			get
			{
				return _M;
			}
			set
			{
				_M = value;
			}
		}
		public Padyam Padyam
		{
			get
			{
				return _P;
			}
			set
			{
				_P = value;
			}
		}
		public Rule Rule
		{
			get
			{
				return _R;
			}
			set
			{
				_R = value;
			}
		}
	}
}
