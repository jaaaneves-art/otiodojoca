function Compare-List {
    param(
        [string]$Name,
        [array]$Database,
        [array]$Schema
    )

    $db = @($Database)
    $sc = @($Schema)

    foreach ($item in $sc) {
        if ($db -contains $item) {
            [PSCustomObject]@{
                Type   = $Name
                Object = $item
                Status = "OK"
            }
        }
        else {
            [PSCustomObject]@{
                Type   = $Name
                Object = $item
                Status = "MISSING"
            }
        }
    }

    foreach ($item in $db) {
        if ($sc -notcontains $item) {
            [PSCustomObject]@{
                Type   = $Name
                Object = $item
                Status = "EXTRA"
            }
        }
    }
}

function Compare-Schema {
    param(
        [Parameter(Mandatory)]
        $Database,

        [Parameter(Mandatory)]
        $Schema
    )

    $results = @()

    $results += Compare-List "Extensions" $Database.Extensions $Schema.Extensions
    $results += Compare-List "Tables"     $Database.Tables     $Schema.Tables
    $results += Compare-List "Functions"  $Database.Functions  $Schema.Functions
    $results += Compare-List "Triggers"   $Database.Triggers   $Schema.Triggers

    return $results
}

Export-ModuleMember -Function Compare-Schema