export default function PaperAssistantSignin({
  config,
  googleButtonRef,
  isSigningIn,
  signInError
}) {
  return (
    <div className="pu-assistant-pattern pu-assistant-choice-bg">
      <div className="pu-assistant-choice-shell text-center">
        <div className="pu-assistant-choice-title">
          <h3>Verify Your Poornima Email</h3>
        </div>
        <p className="mx-auto mt-2 max-w-[340px] text-sm leading-relaxed text-[#ffffff]">
          Sign In With Google Using Your {config.emailDomain} Account To Use This Assistant.
        </p>

        <div className="mx-auto mt-8 w-full max-w-[360px] rounded-[18px]">
          {config.googleClientId ? (
            <div className="flex justify-center" ref={googleButtonRef} />
          ) : (
            <p className="text-sm font-semibold text-red-600">Google Sign-In Client ID Is Missing.</p>
          )}
          {isSigningIn && <p className="mt-4 text-sm font-semibold text-[#05488B]">Verifying Google Account...</p>}
          {signInError && <p className="mt-4 text-sm font-semibold text-red-600">{signInError}</p>}
        </div>
      </div>
    </div>
  );
}
