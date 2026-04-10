//---------------------------------------------------------------------------------------------
// <copyright file="Random.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//
// </copyright>
//---------------------------------------------------------------------------------------------

using System;


namespace Chandam
{
	public class Random
	{
		internal int Next(int p)
		{
			return (int)(Math.Floor(Math.Random() * p));
		}
	}
}
