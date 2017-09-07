$functions = (Get-ChildItem -Path $PSSCriptRoot\*.ps1 -Recurse)

foreach( $function in $functions )
{
    . $function.FullName
}

Export-ModuleMember -Function $functions.BaseName