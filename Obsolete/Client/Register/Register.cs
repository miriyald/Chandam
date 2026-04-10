//---------------------------------------------------------------------------------------------
// <copyright file="Register.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//
// </copyright>
//---------------------------------------------------------------------------------------------

using Chandam.Rules;

namespace IncomingRules
{
	public class Register
	{
		public static void Go()
		{
			Manager.Register(TeluguRules.Rules);
		}
	}
}
