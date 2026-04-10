//---------------------------------------------------------------------------------------------
// <copyright file="SortHelper.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//
// </copyright>
//---------------------------------------------------------------------------------------------

using Chandam.Core;
using System;
using System.Collections.Generic;

namespace Chandam.Rules
{
	public partial class SortHelper2
	{
		public static List<MatchResult> Top(List<MatchResult> L)
		{
			Array r = L.Slice(0);
			r.Sort(delegate (object r1, object r2)
			{
				MatchResult R1 = ((MatchResult)r1);
				MatchResult R2 = ((MatchResult)r2);
				int l1 = R1.Percentage;
				int l2 = R2.Percentage;
				return l1 > l2 ? -1 : l1 < l2 ? 1 : 0;

			});
			return (List<MatchResult>)(r);
		}
	}

}
