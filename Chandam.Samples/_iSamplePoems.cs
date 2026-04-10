//---------------------------------------------------------------------------------------------
// <copyright file="_iSamplePoems.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:34EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

namespace Chandam.Samples
{
	public abstract class SamplePoems
	{

		public abstract string[] Poems
		{
			get;
		}

		public string GetItem(int i)
		{
			return i > 0 && i < Poems.Length ? Poems[i] : Poems[0];
		}
		public int Length()
		{
			return Poems.Length;
		}
	}
}