//---------------------------------------------------------------------------------------------
// <copyright file="External.Social.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:14EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

using MiriyamApp.Social.Facebook;
using System;
using System.Runtime.CompilerServices;

namespace MiriyamApp.External.Social.Facebook
{

	[ScriptIgnoreNamespace]
	[ScriptImport]
	public delegate void FBCallback(FBResponse response);

	[ScriptImport]
	[ScriptIgnoreNamespace]
	public class FBResponse
	{
		[ScriptField]
		public string Status
		{
			get
			{
				return "";
			}
			set
			{
			}
		}
	}

	[ScriptImport]
	[ScriptIgnoreNamespace]
	public static class FB
	{
		public static void Init(InitParams IP)
		{

		}

		public static void Login(FBCallback FBLC, FBScope S)
		{

		}

		[ScriptName("api")]
		public static void API(string apiName, string method, FeedParams FBFP, FBCallback FBR)
		{

		}

	}

	[ScriptExtension("window")]
	public static class FBAPI
	{

		public static void FbAsyncInit()
		{

			InitParams IP = new InitParams();
			IP.AppId = "590773791009851";
			IP.Status = true;
			IP.Xfbml = true;
			IP.Cookie = true;
			FB.Init(IP);

		}

	}
}